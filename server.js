const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://n8n-fk9q.onrender.com/webhook/94a58564-557a-478a-9eb0-a478bbd330e8";

// Persistent ID tracking
const LAST_ID_FILE = "./lastSentId.txt";

function saveLastId(id) {
  fs.writeFileSync(LAST_ID_FILE, id);
}

function loadLastId() {
  try {
    return fs.readFileSync(LAST_ID_FILE, "utf8").trim();
  } catch {
    return "";
  }
}

let lastSentId = loadLastId();

async function getLatestTrumpPost() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

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

// Manual or cronjob trigger (GET request)
app.get("/check", async (_, res) => {
  try {
    const latest = await getLatestTrumpPost();
    if (!latest?.id || latest.id === lastSentId) {
      return res.send("⏸️ No new post.");
    }

    lastSentId = latest.id;
    saveLastId(latest.id);
    await axios.post(WEBHOOK_URL, latest);

    res.send("✅ New post sent to n8n.");
  } catch (err) {
    res.status(500).send("❌ Error while checking.");
  }
});

app.get("/", (_, res) => res.send("✅ Trump bot is live and ready"));

app.listen(PORT, () => {
  console.log(`✅ Listening on port ${PORT}`);
});
