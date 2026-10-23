import { expect, test } from "@playwright/test";

test.describe("Shital Assist (demo engine)", () => {
  test("opens, answers a suggestion with grounded links, and persists the chat", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask Shital Assist" }).first().click();
    const chat = page.getByRole("dialog", { name: /Shital Assist/ });
    await expect(chat).toBeVisible();
    await expect(chat.getByLabel("Message", { exact: true })).toBeFocused();

    await chat.getByRole("button", { name: "Compare XUV 7XO and Scorpio" }).click();
    const log = chat.getByRole("log");
    await expect(log).toContainText("₹13.99 lakh");
    await expect(log.getByRole("link", { name: "Scorpio" })).toHaveAttribute("href", "/cars/scorpio");
    await expect(chat).toContainText("Demo mode");
    // Sending is blocked while a reply streams; wait for the composer to return to "send".
    await expect(chat.getByRole("button", { name: "Send message" })).toBeVisible();

    await chat.getByLabel("Message", { exact: true }).fill("Which workshop is near Chandkheda?");
    await chat.getByLabel("Message", { exact: true }).press("Enter");
    await expect(log).toContainText("Plot No.11");

    // Conversation survives navigation within the tab.
    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden();
    await page.goto("/about");
    await page.getByRole("button", { name: "Ask Shital Assist" }).first().click();
    await expect(page.getByRole("log")).toContainText("Plot No.11");
  });

  test("model page hands a question to the assistant", async ({ page }) => {
    await page.goto("/cars/bolero-neo");
    await page.getByRole("button", { name: /Ask about the Bolero Neo/ }).click();
    const log = page.getByRole("dialog", { name: /Shital Assist/ }).getByRole("log");
    await expect(log).toContainText("Tell me about the Bolero Neo");
    await expect(log).toContainText("₹8.99 lakh");
  });

  test("never invents offers or finance figures", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "What discount and EMI can I get on the Thar ROXX?" }] } });
    expect(res.headers()["x-assistant-mode"]).toBe("demo");
    const text = await res.text();
    expect(text).toContain("don't have current offers");
    expect(text).toContain("/get-price?model=thar-roxx");
  });

  test("rejects malformed requests", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [{ role: "assistant", content: "hi" }] } });
    expect(res.status()).toBe(400);
  });
});
