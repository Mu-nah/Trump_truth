const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://n8n-fk9q.onrender.com/webhook/94a58564-557a-478a-9eb0-a478bbd330e8"; // 🔁 Replace this with your actual n8n webhook
let lastSentId = "";

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function getLatestTrumpPost() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  await page.goto("https://trumpstruth.org", {
    waitUntil: "networkidle2",
    timeout: 0
  });

  const post = await page.evaluate(() => {
    const el = document.querySelector(".status");
    if (!el) return null;

    const text = el.querySelector(".status__content p")?.innerText?.trim();
    const time = el.querySelector(".status-info__meta-item:last-child")?.innerText?.trim();
    const url = el.querySelector(".status__external-link")?.href;
    const dataUrl = el.getAttribute("data-status-url");
    const id = dataUrl?.split("/").pop();

    return { id, text, time, url };
  });

  await browser.close();
  return post;
}

async function loopMonitor() {
  while (true) {
    try {
      const latest = await getLatestTrumpPost();
      if (!latest?.id || latest.id === lastSentId) {
        await sleep(60000); // wait before next check
        continue;
      }

      lastSentId = latest.id;
      await axios.post(WEBHOOK_URL, latest);
    } catch (_) {}
    await sleep(60000); // every 1 min
  }
}

app.get("/", (_, res) => res.send("✅ Trump bot is running"));

app.listen(PORT, () => {
  loopMonitor();
});
