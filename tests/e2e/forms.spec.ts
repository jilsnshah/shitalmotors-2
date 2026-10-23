import { expect, test } from "@playwright/test";

test.describe("lead forms (demo delivery)", () => {
  test("test drive: inline validation, then success with demo notice", async ({ page }) => {
    await page.goto("/test-drive?model=xuv-7xo");
    await expect(page.getByLabel("Model", { exact: true })).toHaveValue("xuv-7xo");

    await page.getByRole("button", { name: "Request test drive" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please select a city.")).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeFocused();

    await page.getByLabel("Full name").fill("Ravi Patel");
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByLabel("City").selectOption("Ahmedabad");
    await expect(page.getByLabel("Showroom")).toBeEnabled();
    await page.getByLabel("Showroom").selectOption({ label: "Chandkheda" });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Request test drive" }).click();
    await expect(page.getByText("Mobile number should be 10 digits.")).toBeVisible();

    await page.getByLabel("Mobile number").fill("98250 12345");
    await page.getByRole("button", { name: "Request test drive" }).click();
    const status = page.getByRole("status");
    await expect(status).toContainText("Test drive request received");
    await expect(status).toContainText("XUV 7XO");
    await expect(status).toContainText("Demo mode");
    await expect(status).toContainText(/SM-[A-Z0-9]+-[A-Z0-9]+/);
  });

  test("service booking requires a future date and a valid registration", async ({ page }) => {
    await page.goto("/service#book");
    const form = page.locator("#book form");
    await form.getByLabel("Full name").fill("Asha Shah");
    await form.getByLabel("Mobile number").fill("9099182000");
    await form.getByLabel("Registration number").fill("GJ01@@");
    await form.getByLabel("Model", { exact: true }).selectOption({ label: "Scorpio" });
    await form.getByLabel("Service type").selectOption("Schedule");
    await form.getByLabel("Workshop").selectOption({ index: 1 });
    await form.getByLabel("Preferred time").selectOption({ index: 1 });
    await form.getByLabel("Preferred date").fill("2020-01-01");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Request appointment" }).click();
    await expect(form.getByText(/valid registration number/)).toBeVisible();
    await expect(form.getByText(/from tomorrow onwards/)).toBeVisible();

    const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    await form.getByLabel("Registration number").fill("GJ 01 AB 1234");
    await form.getByLabel("Preferred date").fill(future);
    await form.getByRole("button", { name: "Request appointment" }).click();
    await expect(page.getByRole("status")).toContainText("Service request received");
    await expect(page.getByRole("status")).toContainText("GJ 01 AB 1234");
  });

  test("contact form switches enquiry type and submits", async ({ page }) => {
    await page.goto("/contact");
    await page.getByText("Feedback", { exact: true }).click();
    await page.getByLabel("Full name").fill("Meera Joshi");
    await page.getByLabel("Mobile number").fill("7574987070");
    await page.getByLabel("Model", { exact: true }).selectOption({ label: "Bolero Neo" });
    await page.getByLabel(/Message/).fill("Great delivery experience.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status")).toContainText("your feedback");
  });

  test("careers form rejects unsupported resume files", async ({ page }) => {
    await page.goto("/careers");
    await page.getByLabel("Full name").fill("Kiran Rao");
    await page.getByLabel("Email").fill("kiran@example.com");
    await page.getByLabel("Mobile number").fill("9375808050");
    await page.getByLabel("About you").fill("Sales executive, 3 years.");
    await page.locator("#resume").setInputFiles({ name: "resume.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByText("Only JPG, DOC, PDF and DOCX files are allowed.")).toBeVisible();

    await page.getByRole("button", { name: "Remove file" }).click();
    await page.locator("#resume").setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("status")).toContainText("Application received");
  });

  test("API rejects invalid payloads server-side", async ({ request }) => {
    const res = await request.post("/api/leads", { data: { type: "price", model: "", name: "1", mobile: "555", city: "Mumbai", outlet: "", consent: false } });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(["model", "name", "mobile", "city", "consent"]));
  });
});
