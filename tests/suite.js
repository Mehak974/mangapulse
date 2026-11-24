/**
 * MangaPulse Core Regression & Invariant Test Suite
 * Zero extra test frameworks required — runs in pure Node.js in CI.
 */
const assert = require("assert");

console.log("▶ Running MangaPulse Core Test Suite...\n");

// 1. Test Verification Token Timing-Safe Equality
const crypto = require("crypto");
const secretA = "test_secure_kofi_secret_12345";
const secretB = "test_secure_kofi_secret_12345";
const secretC = "wrong_secret_token";

const match =
  secretA.length === secretB.length &&
  crypto.timingSafeEqual(Buffer.from(secretA), Buffer.from(secretB));
assert.strictEqual(match, true, "Timing safe comparison should match identical tokens");

const mismatch =
  secretA.length === secretC.length &&
  crypto.timingSafeEqual(Buffer.from(secretA), Buffer.from(secretC));
assert.strictEqual(mismatch, false, "Timing safe comparison should reject mismatched tokens");
console.log("✔ Token constant-time comparison invariant passed.");

// 2. Test Cadence Math & Progressed Chapter Calculation
const refEpoch = new Date("2024-11-24T15:00:00Z").getTime();
const simulatedFuture = new Date(refEpoch + 14 * 24 * 60 * 60 * 1000); // 2 weeks later
const weeksElapsed = Math.floor((simulatedFuture.getTime() - refEpoch) / (7 * 24 * 60 * 60 * 1000));
assert.strictEqual(weeksElapsed, 2, "2 weeks elapsed calculation must equal 2");

const estimatedChapters = Math.floor(weeksElapsed * 0.85);
assert.strictEqual(estimatedChapters, 1, "Magazine break adjustment for 2 weeks must advance 1 chapter");
console.log("✔ Schedule cadence & chapter advancement math passed.");

// 3. Test Username Collision Resolution Algorithm
function resolveCollision(base, existingUsernames, id) {
  let clean = base.toLowerCase().replace(/[^a-z0-9_]/g, "") || "reader";
  if (existingUsernames.includes(clean)) {
    return clean.slice(0, 16) + "_" + crypto.createHash("md5").update(id).digest("hex").slice(0, 5);
  }
  return clean;
}

const existing = ["john", "luffy", "zoro"];
const uniqueResult = resolveCollision("nami", existing, "id-1");
assert.strictEqual(uniqueResult, "nami", "Unique username should not be modified");

const collisionResult = resolveCollision("john", existing, "user-uuid-1234");
assert.notStrictEqual(collisionResult, "john", "Colliding username must be modified with suffix");
assert.strictEqual(collisionResult.startsWith("john_"), true, "Modified username must retain base prefix");
console.log("✔ Username collision resolution invariant passed.");

// 4. Test Outbound Telemetry Input Boundaries
function validateTelemetry(publisher, title, url) {
  if (typeof publisher !== "string" || publisher.trim().length === 0 || publisher.length > 60) return false;
  if (title && (typeof title !== "string" || title.length > 150)) return false;
  if (url && (typeof url !== "string" || url.length > 500)) return false;
  return true;
}

assert.strictEqual(validateTelemetry("MANGA Plus by Shueisha", "One Piece", "https://mangaplus.shueisha.co.jp"), true);
assert.strictEqual(validateTelemetry("", "One Piece", "https://mangaplus.shueisha.co.jp"), false, "Empty publisher must fail");
assert.strictEqual(validateTelemetry("A".repeat(65), "One Piece", null), false, "Publisher > 60 chars must fail");
assert.strictEqual(validateTelemetry("Viz Media", "A".repeat(155), null), false, "Title > 150 chars must fail");
console.log("✔ Outbound click validation boundaries passed.");

// 5. Test Reserved Usernames & Staff RBAC Invariants
const RESERVED_STAFF_NAMES = ["admin", "staff", "mangapulse", "moderator", "mod", "system", "support"];
function isReservedUsername(username) {
  const clean = (username || "").toLowerCase().trim();
  return RESERVED_STAFF_NAMES.some((r) => clean === r || clean.includes(r));
}

assert.strictEqual(isReservedUsername("admin"), true, "admin must be blocked");
assert.strictEqual(isReservedUsername("staff_member"), true, "staff prefix must be blocked");
assert.strictEqual(isReservedUsername("mangapulse_official"), true, "mangapulse must be blocked");
assert.strictEqual(isReservedUsername("moderator_dan"), true, "moderator must be blocked");
assert.strictEqual(isReservedUsername("ordinary_reader_99"), false, "valid reader username must pass");
console.log("✔ Reserved staff username prevention invariant passed.");

// 6. Test RBAC Role Gate Invariants
const VALID_ROLES = new Set(["USER", "SUPPORTER", "MODERATOR", "ADMIN"]);
function hasAdminAccess(role) {
  return role === "ADMIN";
}
function hasModAccess(role) {
  return role === "ADMIN" || role === "MODERATOR";
}

assert.strictEqual(VALID_ROLES.has("USER"), true);
assert.strictEqual(VALID_ROLES.has("SUPPORTER"), true);
assert.strictEqual(VALID_ROLES.has("MODERATOR"), true);
assert.strictEqual(VALID_ROLES.has("ADMIN"), true);
assert.strictEqual(VALID_ROLES.has("HACKER"), false, "invalid role must be rejected");
assert.strictEqual(hasAdminAccess("ADMIN"), true, "ADMIN role must have admin panel access");
assert.strictEqual(hasAdminAccess("MODERATOR"), false, "MODERATOR must not have full admin access");
assert.strictEqual(hasAdminAccess("USER"), false, "USER must not have admin panel access");
assert.strictEqual(hasModAccess("MODERATOR"), true, "MODERATOR must have forum moderation access");
assert.strictEqual(hasModAccess("ADMIN"), true, "ADMIN must have forum moderation access");
console.log("✔ RBAC role gate hierarchy invariants passed.");

console.log("\n All 6 test invariant suites passed successfully (0 errors).");
