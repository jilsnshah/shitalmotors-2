#!/usr/bin/env node
/**
 * Content sync — pulls the dealership's real content from the current
 * website (https://www.shitalmotors.com) into typed JSON + local media.
 *
 *   npm run content:sync            # fetch, parse, download media
 *   npm run content:sync -- --offline   # re-parse cached HTML only
 *
 * Output
 *   src/content/generated/catalog.json   vehicles, variants, colours, specs
 *   src/content/generated/dealer.json    outlets, testimonials, gallery, service, legal
 *   public/media/**                      downloaded images (served by next/image)
 *
 * Raw HTML is cached in .content-cache/ so parsing can be iterated offline.
 * Nothing here is hand-written marketing copy: every value is scraped.
 */
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ORIGIN = "https://www.shitalmotors.com";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(ROOT, ".content-cache");
const OUT = path.join(ROOT, "src/content/generated");
const MEDIA = path.join(ROOT, "public/media");
const OFFLINE = process.argv.includes("--offline");
const UA = "Mozilla/5.0 (compatible; ShitalMotorsContentSync/1.0)";
const MAX_PICTURES = 10;

/* ------------------------------------------------------------------ utils */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

const stripTags = (s) => decode(s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
const clean = (s) => stripTags(s).replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
const oneLine = (s) => clean(s).replace(/\s+/g, " ").trim();
const lines = (html) =>
  clean(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<\/(p|div|li|h\d|tr|span)>/gi, "\n"))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lakh = (s) => {
  const m = String(s).match(/([\d.]+)\s*Lakh/i) ?? String(s).match(/₹\s*([\d.]+)/);
  return m ? Math.round(parseFloat(m[1]) * 100000) : null;
};
const all = (re, s) => [...s.matchAll(re)];
const normaliseFuel = (f) => (/electric/i.test(f) ? "Electric" : f);

async function fetchText(urlPath) {
  const file = path.join(CACHE, slugify(urlPath) + ".html");
  if (OFFLINE || existsSync(file)) {
    if (existsSync(file)) return readFile(file, "utf8");
    throw new Error(`offline and not cached: ${urlPath}`);
  }
  const url = urlPath.startsWith("http") ? urlPath : ORIGIN + urlPath;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, "x-requested-with": urlPath.includes("popup") ? "XMLHttpRequest" : "" } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const text = await res.text();
      await writeFile(file, text);
      return text;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

/** Reads width/height from JPEG/PNG headers so next/image gets real dimensions. */
function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

const downloads = [];
/** Queues a remote image for download and returns its media record. */
function media(remote, localDir, name) {
  if (!remote) return null;
  const url = remote.startsWith("//") ? "https:" + remote : remote.replace(/^http:/, "https:");
  const ext = (url.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
  const file = `${slugify(name)}.${ext}`;
  const rec = { src: `/media/${localDir}/${file}`, source: url, width: null, height: null };
  downloads.push({ url, dest: path.join(MEDIA, localDir, file), rec });
  return rec;
}

async function runDownloads() {
  let done = 0, failed = 0;
  const queue = [...downloads];
  const worker = async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        await mkdir(path.dirname(job.dest), { recursive: true });
        let buf;
        if (existsSync(job.dest) && (await stat(job.dest)).size > 0) buf = await readFile(job.dest);
        else if (OFFLINE) throw new Error("offline");
        else {
          const res = await fetch(job.url, { headers: { "user-agent": UA } });
          if (!res.ok) throw new Error(String(res.status));
          buf = Buffer.from(await res.arrayBuffer());
          await writeFile(job.dest, buf);
        }
        Object.assign(job.rec, imageSize(buf) ?? {});
        done++;
      } catch (err) {
        job.rec.failed = true;
        failed++;
        console.warn(`  ! media ${job.url}: ${err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`media: ${done} ok, ${failed} failed`);
}

/** Drops media records whose download failed so the UI never renders a broken image. */
function pruneFailed(value) {
  if (Array.isArray(value)) return value.map(pruneFailed).filter((v) => !(v && v.failed));
  if (value && typeof value === "object") {
    if ("src" in value && "source" in value) {
      const { failed, ...rest } = value;
      return failed ? { failed: true } : rest;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const p = pruneFailed(v);
      out[k] = p && p.failed ? null : p;
    }
    return out;
  }
  return value;
}

/* --------------------------------------------------------------- parsers */

/** Generic parser for the `<td data-th="...">` responsive tables used site-wide. */
function parseDataTable(html) {
  const table = html.match(/<div class="accestable">[\s\S]*?<table>([\s\S]*?)<\/table>/)?.[1];
  if (!table) return [];
  return all(/<tr>([\s\S]*?)<\/tr>/g, table)
    .map(([, row]) => {
      const cells = {};
      for (const [, th, body] of all(/<td[^>]*data-th="([^"]*)"[^>]*>([\s\S]*?)<\/td>/g, row)) cells[th.trim()] = body;
      return cells;
    })
    .filter((c) => Object.keys(c).length);
}

function parseListing(html) {
  // Listing cards: image (with alt), price, and a "View Details" link.
  const items = [];
  for (const [block] of all(/<li[^>]*>\s*<div class="[^"]*">[\s\S]*?View Details[\s\S]*?<\/li>/g, html)) {
    const img = block.match(/<img src="([^"]+)" alt="([^"]+)"/);
    const href = block.match(/href="(\/new-(?:cars|trucks)\/[^"]+\.html)"/);
    const price = block.match(/<i class="rupee">[\s\S]*?<\/i>\s*([\d.]+)/) ?? block.match(/₹[\s\S]{0,80}?([\d.]+)/);
    if (img && href) items.push({ name: decode(img[2]).trim(), href: href[1], image: img[1], price: price ? Math.round(parseFloat(price[1]) * 100000) : null });
  }
  if (items.length) return items;
  // Fallback: pair 630x420 images with prices by order.
  const imgs = all(/<img src="(https:\/\/[^"]+)" alt="([^"]+)" title="[^"]+">/g, html);
  const hrefs = [...new Set(all(/href="(\/new-(?:cars|trucks)\/[^"/]+\.html)"/g, html).map((m) => m[1]))];
  const prices = all(/Price Starts at[\s\S]*?([\d.]+)\s*<span/g, html).map((m) => Math.round(parseFloat(m[1]) * 100000));
  return imgs.map(([, image, name], i) => ({
    name: decode(name).trim(),
    image,
    price: prices[i] ?? null,
    href: hrefs.find((h) => h.includes(slugify(decode(name)).replace(/^mahindra-/, ""))) ?? hrefs[i],
  }));
}

function parseColors(html) {
  return all(/data-src="([^"]+)"\s+data-color="([^"]+)"\s+class="colorcricle[^"]*"\s+style="background:\s*(#[0-9a-f]{3,6})"/gi, html).map(
    ([, image, name, hex]) => ({ name: decode(name).trim(), hex: hex.toLowerCase(), image }),
  );
}

function parseCarVariants(html) {
  return parseDataTable(html).map((c) => {
    const nameCell = c["Variants"] ?? "";
    return {
      name: oneLine(nameCell.match(/class="modelvname">([\s\S]*?)<\/a>/)?.[1] ?? nameCell),
      fuel: normaliseFuel(oneLine(nameCell.match(/class="vartext">([\s\S]*?)<\/span>/)?.[1] ?? "")),
      transmission: oneLine(c["Transmission"] ?? "") || null,
      engine: oneLine(c["Engine Description"] ?? "") || null,
      power: oneLine(c["Power"] ?? "").replace(/\s+@\s*/, " @ ") || null,
      battery: oneLine(c["Battery Capacity"] ?? "") || null,
      range: oneLine(c["Range"] ?? "") || null,
      price: lakh(oneLine(c["Ex-Showroom Price"] ?? "")),
      brochure: (c["Brochure"] ?? "").match(/href="([^"]+\.pdf)"/)?.[1] ?? null,
    };
  });
}

function parseTruckVariants(html) {
  return parseDataTable(html).map((c) => {
    const nameCell = c["Variants"] ?? "";
    const val = (k) => {
      const v = oneLine(c[k] ?? "").replace(/\s+/g, " ");
      return v && !/^(mm|Tons|kW\s*BHP)$/i.test(v) ? v : null;
    };
    return {
      name: oneLine(nameCell.match(/class="modelvname">([\s\S]*?)<\/a>/)?.[1] ?? nameCell.replace(/<span[\s\S]*$/, "")),
      fuel: oneLine(nameCell.match(/class="vartext">([\s\S]*?)<\/span>/)?.[1] ?? "") || null,
      power: val("Maximum Power")?.replace(/\s*BHP$/, "") ?? null,
      wheelbase: val("Wheelbase"),
      gvw: val("GVW"),
      price: lakh(oneLine(c["Ex-showroom Price"] ?? c["Ex-Showroom Price"] ?? "")),
    };
  });
}

function parseSpecs(html) {
  const names = Object.fromEntries(all(/onClick="showvariantlist\('(\d+)'[^"]*">([^<]+)<\/li>/g, html).map(([, id, n]) => [id, decode(n).trim()]));
  const blocks = html.split(/<div class="specresult" id="specresult/).slice(1);
  return blocks.map((b) => {
    const id = b.match(/^(\d+)/)?.[1];
    const groups = [];
    for (const [, title, body] of all(/<div class="title">([\s\S]*?)<\/div>\s*<div class="specresultdata">([\s\S]*?)<\/ul>/g, b)) {
      const items = all(/<div class="left">([\s\S]*?)<\/div>\s*<div class="right">([\s\S]*?)<\/div>/g, body)
        .map(([, k, v]) => ({ label: oneLine(k).replace(/_/g, " ").replace("Cargo Volumn", "Cargo Volume").replace("Maximum Power With Unit", "Maximum Power"), value: oneLine(v) }))
        .map((i) => (i.label === "Fuel Type" ? { ...i, value: normaliseFuel(i.value) } : i))
        .filter((i) => i.value && !["-", "null", "NA", "N/A"].includes(i.value));
      if (items.length) groups.push({ title: oneLine(title), items });
    }
    return { variantId: id, variant: names[id] ?? null, groups };
  });
}

const VIEW_ORDER = ["front-left-side", "front-view", "side-view-(left)", "rear-left-view", "rear-view", "front-right-view", "rear-right-side", "exterior-image", "headlight", "taillight", "wheel", "grille", "dashboard", "steering", "interior", "seats", "infotainment"];
function parsePictures(html) {
  const urls = [...new Set(all(/https:\/\/[^"' )]+\/930x620\/[^"' )]+\.(?:jpe?g|png|webp)/gi, html).map((m) => m[0]))];
  const rank = (u) => {
    const f = u.split("/").pop();
    const i = VIEW_ORDER.findIndex((v) => f.startsWith(v));
    return i === -1 ? 99 : i;
  };
  return urls.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_PICTURES);
}

function pictureLabel(url) {
  return url.split("/").pop().replace(/-\d+\.\w+$/, "").replace(/[()]/g, "").replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseHours(block) {
  const days = all(/<div class="dayname">([^<]+)<\/div>\s*<div class="daytime">([^<]+)<\/div>/g, block).map(([, d, t]) => ({ day: d.trim(), hours: t.trim().replace(/\s*-\s*/, " – ") }));
  return days;
}

/* ------------------------------------------------------------------ main */

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(OUT, { recursive: true });

  /* ---------- catalog: passenger vehicles */
  const listing = await fetchText("/new-cars.html");
  const evListing = await fetchText("/new-cars.html?type=ev");
  const evNames = new Set(parseListing(evListing).map((i) => i.name));
  const carItems = parseListing(listing);
  console.log(`cars: ${carItems.length}`);

  const cars = [];
  for (const item of carItems) {
    const base = item.href.replace(/\.html$/, "");
    const sourceSlug = base.split("/").pop();
    const slug = sourceSlug.replace(/^mahindra-/, "");
    const [overview, pictures, specification] = await Promise.all([
      fetchText(item.href),
      fetchText(`${base}/pictures.html`).catch(() => ""),
      fetchText(`${base}/specification.html`).catch(() => ""),
    ]);
    const variants = parseCarVariants(overview);
    const fuels = [...new Set(variants.map((v) => v.fuel).filter(Boolean))];
    const transmissions = [...new Set(variants.map((v) => v.transmission).filter(Boolean))];
    const prices = variants.map((v) => v.price).filter(Boolean);
    const specs = parseSpecs(specification);
    const hero = item.image.replace("/630x420/", "/930x620/");
    const name = item.name.replace(/^Mahindra\s+/, "");
    cars.push({
      slug,
      sourceUrl: ORIGIN + item.href,
      name,
      fullName: item.name,
      segment: fuels.length === 1 && fuels[0] === "Electric" ? "electric" : "suv",
      featuredAsEv: evNames.has(item.name),
      startingPrice: item.price ?? (prices.length ? Math.min(...prices) : null),
      topPrice: prices.length ? Math.max(...prices) : null,
      fuels,
      transmissions,
      image: media(hero, `cars/${slug}`, "hero"),
      thumb: media(item.image, `cars/${slug}`, "thumb"),
      colors: parseColors(overview).map((c) => ({ name: c.name, hex: c.hex, image: media(c.image, `cars/${slug}/colours`, `${c.name}-${c.image.split("/").pop().replace(/\.\w+$/, "").slice(-6)}`) })),
      // Several pictures share a label ("Exterior Image"), so name files after the source URL.
      pictures: parsePictures(pictures).map((u) => ({ label: pictureLabel(u), image: media(u, `cars/${slug}/pictures`, u.split("/").slice(-2).join("-").replace(/\.\w+$/, "")) })),
      variants,
      specs,
    });
  }

  /* ---------- catalog: commercial vehicles */
  const trucks = [];
  for (const [type, label, url] of [
    ["pickup", "Pick-Ups", "/new-trucks.html?type=Pickup"],
    ["scv", "Small Commercial Vehicles", "/new-trucks.html?type=Mini%20Truck"],
  ]) {
    const items = parseListing(await fetchText(url)).filter((i) => i.href?.startsWith("/new-trucks/"));
    console.log(`trucks ${type}: ${items.length}`);
    for (const item of items) {
      const slug = item.href.split("/").pop().replace(/\.html$/, "");
      const html = await fetchText(item.href);
      const variants = parseTruckVariants(html);
      const prices = variants.map((v) => v.price).filter(Boolean);
      trucks.push({
        slug,
        sourceUrl: ORIGIN + item.href,
        name: item.name,
        type,
        typeLabel: label,
        startingPrice: item.price ?? (prices.length ? Math.min(...prices) : null),
        topPrice: prices.length ? Math.max(...prices) : null,
        image: media(item.image, `commercial/${slug}`, "hero"),
        variants,
      });
    }
  }

  /* ---------- lead-form model list (exact options offered by the dealer) */
  const formHtml = await fetchText("/customer-profile/create-service?type=bookATestDrive&popup=1");
  const formModels = all(/<option value="(\d+)">([^<]+)<\/option>/g, formHtml.match(/Customerprofile\[model_id\][\s\S]*?<\/select>/)?.[0] ?? "").map(([, id, n]) => ({ id, name: decode(n).trim() }));
  // The contact form also lists discontinued models, which owners still bring in for service.
  const contactHtml = await fetchText("/contact-us.html");
  const serviceModels = [...new Set(all(/<option value="\d+">([^<]+)<\/option>/g, contactHtml.match(/<select[^>]*model_id[^>]*>[\s\S]*?<\/select>/)?.[0] ?? "").map(([, n]) => decode(n).trim()))];
  const serviceForm = await fetchText("/book-service/bookservicepopup?id=929&popup=1");
  const serviceTypes = all(/<option value="([^"]+)">([^<]+)<\/option>/g, serviceForm.match(/BookService\[service_type\][\s\S]*?<\/select>/)?.[0] ?? "").map(([, , n]) => decode(n).trim());
  const serviceSlots = all(/<option value="([^"]*)">([^<]+)<\/option>/g, serviceForm.match(/BookService\[service_time\][\s\S]*?<\/select>/)?.[0] ?? "").map(([, , n]) => decode(n).trim()).filter((s) => /\d/.test(s));

  /* ---------- outlets */
  const outlets = [];
  for (const [kind, url] of [["showroom", "/outlet/showroom.html"], ["workshop", "/outlet/workshop.html"]]) {
    const html = await fetchText(url);
    const links = [...new Set(all(/href="(\/outlet\/(?:showroom|workshop)-[^"]+\.html)"/g, html).map((m) => m[1]))];
    for (const link of links) {
      const detail = await fetchText(link);
      const ls = lines(detail);
      const i = ls.indexOf("Car Outlets");
      const name = ls[i + 1];
      const addrStart = ls[i + 2] === "5/5" || /^\d\/5$/.test(ls[i + 3]) ? i + 4 : i + 2;
      const block = detail.match(/<address[\s\S]*?<\/address>/)?.[0];
      let address = block ? oneLine(block) : null;
      if (!address) {
        const ot = ls.indexOf("Outlet Type", i);
        address = ls.slice(addrStart - (ls[i + 2] === name ? 0 : 1), ot).filter((l) => !/^\d\/5$/.test(l) && l !== name).join(" ").replace(/\s+,/g, ",").replace(/,,/g, ",");
      }
      const cs = ls.indexOf("Contact Support");
      const geo = detail.match(/maps\.google\.com\/\?q=(-?[\d.]+)%2C(-?[\d.]+)/);
      const pin = address.match(/(\d{6})\s*$/)?.[1] ?? null;
      const city = /Surendranagar/i.test(address) ? "Surendranagar" : /Sanand,/i.test(address) ? "Sanand" : "Ahmedabad";
      const area = name.replace(/^Shital Motors\s*-\s*/, "").trim();
      outlets.push({
        id: `${kind}-${slugify(area)}`,
        kind,
        name,
        area,
        city,
        address: address.replace(/\s+/g, " ").replace(/ ,/g, ",").trim(),
        pincode: pin,
        phones: (ls[cs + 1] ?? "").split(/[,/]/).map((p) => p.replace(/\D/g, "")).filter((p) => p.length >= 10),
        email: ls[ls.indexOf("Email Address") + 1]?.includes("@") ? ls[ls.indexOf("Email Address") + 1] : null,
        geo: geo ? { lat: parseFloat(geo[1]), lng: parseFloat(geo[2]) } : null,
        hours: parseHours(detail),
        sourceUrl: ORIGIN + link,
      });
    }
  }
  console.log(`outlets: ${outlets.length}`);

  /* ---------- testimonials (curated list published by the dealer) */
  const tHtml = await fetchText("/testimonial.html");
  const seen = new Set();
  const testimonials = [];
  {
    const ls = lines(tHtml);
    const start = ls.indexOf("Add Testimonial") + 1;
    const end = ls.indexOf("Get Price", start);
    let i = start;
    while (i < end) {
      const name = ls[i], city = ls[i + 1];
      if (!ls[i + 2]?.startsWith('"')) { i++; continue; }
      let j = i + 2; const buf = [];
      while (j < end) { buf.push(ls[j]); if (ls[j].endsWith('"')) break; j++; }
      const text = buf.join("\n").replace(/^"|"$/g, "").trim();
      const key = text.toLowerCase().replace(/\W+/g, "");
      // One entry on the source page is a video-shoot request, not a customer review.
      const notATestimonial = /social media influencer|shoot a video/i.test(text);
      if (!seen.has(key) && !notATestimonial) { seen.add(key); testimonials.push({ name: name.trim(), city: city.trim(), text }); }
      i = j + 1;
    }
  }
  console.log(`testimonials: ${testimonials.length}`);

  /* ---------- gallery */
  const gHtml = await fetchText("/gallery.html");
  const galleryCats = ["Showroom Images", "Awards", "Delivering Happiness"];
  const gallery = galleryCats.map((title) => {
    const key = slugify(title);
    const urls = [...new Set(all(new RegExp(`https://mahindraimages\\.dealersites\\.in/139/gallery/${key}-\\d+\\.(?:jpe?g|png)`, "g"), gHtml).map((m) => m[0]))];
    return { id: key, title, images: urls.map((u) => media(u, `gallery/${key}`, u.split("/").pop().replace(/\.\w+$/, ""))) };
  });

  /* ---------- videos */
  const vHtml = await fetchText("/videos.html");
  const vLines = lines(vHtml);
  const videoMeta = all(/vi\/([\w-]+)\/0\.jpg"[^>]*?title="([^"]+)"/g, vHtml).map(([, id, title]) => ({ id, title: decode(title).trim() }));
  const vStart = vLines.indexOf("Videos", vLines.indexOf("Videos") + 1) + 1;
  let category = null;
  const videos = [];
  for (const l of vLines.slice(vStart)) {
    if (l === "Get Price") break;
    const v = videoMeta.find((m) => m.title === l);
    if (v) videos.push({ ...v, category, thumb: media(`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, "videos", v.id) });
    else category = l;
  }

  /* ---------- service */
  const sHtml = await fetchText("/bookservice.html");
  const sLines = lines(sHtml);
  const offerings = all(/<h3 class="title">([\s\S]*?)<\/h3>\s*<p class="description">([\s\S]*?)<\/p>/g, sHtml).map(([, t, d]) => ({ title: oneLine(t), text: oneLine(d) }));
  const serviceVideos = all(/vi\/([\w-]+)\/0\.jpg"[^>]*?title="([^"]+)"/g, sHtml).map(([, id, title]) => ({ id, title: decode(title).trim(), thumb: media(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, "videos", id) }));
  const walkaround = sHtml.match(/data-embed="https:\/\/www\.youtube\.com\/embed\/([\w-]+)"/)?.[1] ?? null;
  // Queue every media download before runDownloads() executes.
  const walkaroundThumb = walkaround ? media(`https://i.ytimg.com/vi/${walkaround}/hqdefault.jpg`, "videos", walkaround) : null;
  const serviceGallery = [...new Set(all(/https:\/\/mahindraimages\.dealersites\.in\/139\/gallery\/service-center-\d+\.jpg/g, sHtml).map((m) => m[0]))].map((u) => media(u, "service", u.split("/").pop().replace(/\.\w+$/, "")));
  const serviceBanners = [...new Set(all(/https:\/\/mahindraimages\.dealersites\.in\/139\/banner\/[\w-]+\.jpg/g, sHtml).map((m) => m[0]))].map((u) => media(u, "service", u.split("/").pop().replace(/\.\w+$/, "")));
  const workshopPhotos = [...new Set(all(/https:\/\/mahindraimages\.dealersites\.in\/139\/outlet_gallery\/[\w-]+\.jpg/g, sHtml).map((m) => m[0]))].map((u) => media(u, "outlets", u.split("/").pop().replace(/\.\w+$/, "")));
  const intro = sLines.slice(sLines.indexOf("Book service") + 1, sLines.indexOf("Our Outlets"));
  const appLinks = {
    android: sHtml.match(/href="([^"]+)"><img src="[^"]*google-play/)?.[1] ?? null,
    ios: sHtml.match(/href="([^"]+)"><img src="[^"]*app-stare/)?.[1] ?? null,
    whatsapp: sHtml.match(/href="([^"]+)"><img src="[^"]*Whatsapp/)?.[1] ?? null,
  };

  /* ---------- home + about */
  const home = await fetchText("/");
  const ld = all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, home).map(([, j]) => { try { return JSON.parse(j); } catch { return null; } }).filter(Boolean);
  const org = ld.find((j) => j["@type"] === "Organization");
  const heroBanners = [...new Set(all(/data-src="(https:\/\/mahindraimages\.dealersites\.in\/oem_banner\/[^"]+)"[^>]*alt="([^"]*)"/g, home).map((m) => m[1] + "|" + m[2]))].map((s) => {
    const [u, alt] = s.split("|");
    return { alt: decode(alt), image: media(u, "banners", u.split("/").pop().replace(/\.\w+$/, "")) };
  });
  const homeLines = lines(home);
  const since = homeLines.join(" ").match(/since (\d{4})/i)?.[1] ?? null;
  const salesPhones = (homeLines[homeLines.indexOf("Sales") + 1] ?? "").split(",").map((p) => p.trim());
  const servicePhones = (homeLines[homeLines.indexOf("Service") + 1] ?? "").split(",").map((p) => p.trim());
  const aboutHtml = await fetchText("/about-us.html");
  const aLines = lines(aboutHtml);
  const about = aLines.slice(aLines.indexOf("About Us", aLines.indexOf("About Us") + 1) + 1, aLines.indexOf("Get Price")).join(" ").replace(/^About Us\s+/, "").replace(/\s+"/g, ' "').replace(/"\s+/g, '" ');
  const aboutImage = media(ORIGIN + "/themes/mahindra-rise/image/about3.jpg", "brand", "about");
  const socials = {
    facebook: home.match(/href="(https:\/\/www\.facebook\.com\/[^"]+)"/)?.[1] ?? null,
    instagram: home.match(/href="(https:\/\/www\.instagram\.com\/[^"]+)"/)?.[1] ?? null,
    x: home.match(/href="(https:\/\/twitter\.com\/[^"]+)"/)?.[1] ?? null,
    linkedin: home.match(/href="https:\/\/www\.linkedin\.com\/company\/(\d+)/)?.[1] ? `https://www.linkedin.com/company/${home.match(/linkedin\.com\/company\/(\d+)/)[1]}/` : null,
  };
  const ownership = {
    rsa: home.match(/href="(https:\/\/www\.withyouhamesha\.com\/RSA\.aspx)"/)?.[1] ?? null,
    shield: home.match(/href="(https:\/\/www\.withyouhamesha\.com\/shield\.aspx)"/)?.[1] ?? null,
  };

  /* ---------- legal */
  const legal = {};
  for (const [key, url, title] of [["privacy", "/privacy.html", "Privacy Policy"], ["terms", "/terms-and-conditions.html", "Terms and Conditions"], ["disclaimer", "/disclaimer.html", "Disclaimer"]]) {
    const html = await fetchText(url);
    const body = html.match(/<h1>[\s\S]*?<\/h1>([\s\S]*?)<\/section>/)?.[1] ?? "";
    // The source HTML nests <ul> inside <p>, so tokenise on block boundaries
    // instead of trusting the tree. A paragraph that is only bold text is a heading.
    const blocks = [];
    for (const chunk of body.replace(/<\/?ul>/gi, "").split(/<\/?p[^>]*>|<\/li>/i)) {
      const [lead, ...items] = chunk.split(/<li[^>]*>/i);
      const push = (kind, html) => {
        const text = oneLine(html);
        if (text && blocks.at(-1)?.text !== text) blocks.push({ kind, text });
      };
      const isHeading = /^\s*<(strong|b)>[\s\S]*<\/\1>\s*$/i.test(lead) && oneLine(lead).length < 140;
      push(isHeading ? "heading" : "para", lead);
      for (const item of items) push("item", item);
    }
    legal[key] = { title, sourceUrl: ORIGIN + url, blocks };
  }

  await runDownloads();

  const catalog = pruneFailed({ generatedAt: new Date().toISOString(), source: ORIGIN, priceNote: "Ex-showroom price, Ahmedabad. Prices are subject to change; contact the nearest showroom for current pricing.", cars, trucks, formModels, serviceModels });
  const dealer = pruneFailed({
    generatedAt: new Date().toISOString(),
    source: ORIGIN,
    name: org?.name ?? "Shital Motors",
    tagline: "Authorised Mahindra Dealer",
    since,
    about,
    aboutImage,
    url: org?.url ?? ORIGIN,
    contact: {
      salesPhones,
      servicePhones,
      serviceBookingPhone: sLines.find((l) => /AHMEDABAD:-/.test(l))?.match(/(\d{10})/)?.[1] ?? null,
      email: org?.contactPoint?.[0]?.email ?? null,
      workshopEmail: home.match(/mailto:(crm\.[^"]+)"/)?.[1] ?? null,
      hours: oneLine(home.match(/Working Hours\s*<strong>([^<]+)<\/strong>/)?.[1] ?? "") || null,
    },
    socials,
    ownership,
    appLinks,
    heroBanners,
    outlets,
    testimonials,
    gallery,
    videos,
    service: { intro, offerings, videos: serviceVideos, walkaround, walkaroundThumb, gallery: serviceGallery, banners: serviceBanners, workshopPhotos, serviceTypes, serviceSlots },
    legal,
  });

  await writeFile(path.join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  await writeFile(path.join(OUT, "dealer.json"), JSON.stringify(dealer, null, 2) + "\n");
  // Tiny route manifest for src/proxy.ts (kept separate so the proxy bundle stays small).
  await writeFile(path.join(OUT, "slugs.json"), JSON.stringify({ cars: cars.map((c) => c.slug), commercial: trucks.map((t) => t.slug) }, null, 2) + "\n");
  console.log(`wrote ${path.relative(ROOT, OUT)}/catalog.json, dealer.json and slugs.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
