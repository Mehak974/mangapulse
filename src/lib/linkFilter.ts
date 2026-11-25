/**
 * Shared Link & Piracy Protection Filter for User Generated Content
 * Prohibits links, URLs, and web addresses across forums and reviews to prevent pirated link distribution.
 */

export function containsLink(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  // 1. Explicit protocols (http://, https://, ftp://)
  if (/https?:\/\/[^\s]+/i.test(text) || /ftp:\/\/[^\s]+/i.test(text)) {
    return true;
  }

  // 2. www-prefixed addresses
  if (/\bwww\.[a-z0-9-]+\.[a-z]{2,}/i.test(text)) {
    return true;
  }

  // 3. Domain + common generic/pirate TLDs (e.g. .com, .org, .net, .to, .ru, .me, .io, .gg, etc.)
  const tldPattern = /\b[a-z0-9-]+\.(com|org|net|io|co|me|to|ru|cc|gg|app|site|xyz|top|live|link|online|fun|club|tv|mobi|info|biz|pro|dev|page|work|su|is|cx|st|re|pw|ws)\b/i;
  if (tldPattern.test(text)) {
    return true;
  }

  // 4. Markdown links e.g. [text](url)
  if (/\[.*?\]\([^\)]+\)/i.test(text)) {
    return true;
  }

  // 5. HTML anchor tags <a href="...">
  if (/<a\s+[^>]*href/i.test(text)) {
    return true;
  }

  // 6. Dot obfuscations: 'example[.]com', 'example(dot)com', 'example dot com'
  if (/[a-z0-9-]+(\[\.\]|\(dot\)|\s+dot\s+|\(\.\))[a-z]{2,}/i.test(text)) {
    return true;
  }

  return false;
}

export const NO_LINKS_POLICY_MSG =
  "Posting links or URLs is disabled to protect our legal compliance and prevent unauthorized links. Please share text-only discussion.";
