import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const failed = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));
page.on("requestfailed", (req) => {
  failed.push(`${req.url()} ${req.failure()?.errorText}`);
});

await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle", timeout: 120000 });

// wait for loader to hide or timeout
let loaderVisible = true;
try {
  await page.waitForSelector("#loader", { state: "hidden", timeout: 30000 });
  loaderVisible = false;
} catch {
  loaderVisible = true;
}

const webgl = await page.$("#webgl");
const loader = await page.$("#loader");
const title = await page.title();

console.log("title:", title);
console.log("loader visible:", loaderVisible, loader !== null);
console.log("webgl present:", webgl !== null);
console.log("errors:", errors.slice(0, 20));
console.log("failed requests:", failed.filter((u) => !u.includes("favicon")).slice(0, 30));

await browser.close();
