import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

export async function runLighthouse(url: string) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance"],
    });
    if (!result) throw new Error("Lighthouse returned no result");
    return result.lhr;
  } finally {
    await chrome.kill(); // always close Chrome, even if the audit fails
  }
}