const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.join(__dirname, "..", "public", "kofi");

const items = ["coffee", "pro", "patron"];

async function renderAll() {
  for (const item of items) {
    const htmlPath = path.join(outDir, `${item}.html`);
    const pngPath = path.join(outDir, `${item}.png`);
    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

    console.log(`Rendering ${item}...`);
    await new Promise((resolve, reject) => {
      execFile(
        chromePath,
        [
          "--headless=new",
          `--screenshot=${pngPath}`,
          "--window-size=1000,1000",
          "--default-background-color=00000000",
          "--hide-scrollbars",
          fileUrl,
        ],
        (err, stdout, stderr) => {
          if (err) {
            console.error(`Error rendering ${item}:`, err);
            reject(err);
          } else {
            console.log(`Saved ${pngPath}`);
            resolve();
          }
        }
      );
    });
  }
  console.log("All Ko-fi tier images rendered successfully!");
}

renderAll().catch(console.error);
