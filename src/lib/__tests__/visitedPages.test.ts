import assert from "assert";
import { normalizePagePath, recordVisitedPage, getVisitedPages } from "../visitedPages";

async function runCheck() {
  // 1. Check path normalization and filtering
  assert.strictEqual(normalizePagePath("/manga/chainsaw-man/"), "/manga/chainsaw-man");
  assert.strictEqual(normalizePagePath("https://www.mangapulse.co/release-date/one-piece?utm=social"), "/release-date/one-piece");
  assert.strictEqual(normalizePagePath("/"), null);
  assert.strictEqual(normalizePagePath("/api/search"), null);
  assert.strictEqual(normalizePagePath("/admin/dmca"), null);
  assert.strictEqual(normalizePagePath("/icon.png"), null);

  // 2. Check recording a visited page
  const recorded = await recordVisitedPage("/manga/test-series-unique-123", {
    title: "Test Series Unique",
  });
  assert(recorded !== null, "Page should be recorded");
  assert.strictEqual(recorded.path, "/manga/test-series-unique-123");
  assert(recorded.url.includes("/manga/test-series-unique-123"));

  // 3. Check getVisitedPages includes the recorded page
  const all = await getVisitedPages();
  const found = all.find((p) => p.path === "/manga/test-series-unique-123");
  assert(found !== undefined, "Recorded page should be found in visited pages");

  console.log("visitedPages self-check passed successfully!");
}

runCheck().catch((err) => {
  console.error("visitedPages self-check failed:", err);
  process.exit(1);
});
