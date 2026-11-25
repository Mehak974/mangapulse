import fs from "fs";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("Missing RESEND_API_KEY environment variable");
  process.exit(1);
}

const textContent = `Dear comeso GmbH Legal & Copyright Operations Team,

We are writing regarding an automated DMCA notice submitted by comeso GmbH on behalf of Kodansha on November 25, 2026 (Lumen Database Notice ID: 104048545).

The notice requested the Google Search delisting of the following MangaPulse URLs:
• https://mangapulse.co/manga/rent-a-girlfriend-99943 (Kanojo, Okarishimasu)
• https://www.mangapulse.co/manga/gachiakuta (Gachiakuta)

1. FACTUAL CLARIFICATION & NON-INFRINGEMENT:
MangaPulse is NOT an online reader, aggregator, or scanlation host. We DO NOT host, rip, stream, store, or display any copyrighted manga pages, scans, raw images, or downloadable files on our servers.

2. PURPOSE OF MANGAPULSE:
MangaPulse operates strictly as:
• A release schedule countdown timer and tracking catalog.
• A personal reading log where users mark checkboxes to track chapters they have read.
• An official publisher directory: Outbound links on our site redirect users exclusively to official licensed digital platforms—specifically Kodansha's official K Manga service (https://kmanga.kodansha.com), Shueisha (MANGA Plus), Viz Media, and authorized retailers (BookWalker/Amazon).

Our platform actively converts search traffic away from illegal scanlation websites and directs paying readers to Kodansha's authorized platforms.

3. ACTION REQUESTED:
Because no infringing material is hosted on MangaPulse, we respectfully request that comeso GmbH:
1. Submit an expedited retraction/withdrawal of Lumen Notice 104048545 to Google Search to restore the affected indexing.
2. Add the domain "mangapulse.co" (and "www.mangapulse.co") to your automated scraping whitelist to prevent repeated false-positive notices against our official directory.

Our full DMCA & Zero-Image-Hosting compliance policy is published at:
https://mangapulse.co/dmca

If your team requires any further verification, please feel free to reply directly to this email.

Thank you for your prompt cooperation and dedication to intellectual property protection.

Sincerely,
MangaPulse Administration & Compliance Team
Website: https://mangapulse.co
Email: dmca@mangapulse.co
`;

const htmlContent = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="color: #0f172a; margin: 0;">MangaPulse Legal & Copyright Compliance</h2>
    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Directory & Release Index • https://mangapulse.co</p>
  </div>

  <p>Dear <strong>comeso GmbH</strong> Legal &amp; Copyright Operations Team,</p>

  <p>We are writing regarding an automated DMCA takedown notice submitted by comeso GmbH on behalf of Kodansha on November 25, 2026 (<strong>Lumen Database Notice ID: 104048545</strong>).</p>

  <p>The notice requested the Google Search delisting of the following MangaPulse URLs:</p>
  <ul style="background: #f8fafc; padding: 12px 24px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 13px;">
    <li><a href="https://mangapulse.co/manga/rent-a-girlfriend-99943" style="color: #2563eb;">https://mangapulse.co/manga/rent-a-girlfriend-99943</a> (<em>Kanojo, Okarishimasu</em>)</li>
    <li><a href="https://www.mangapulse.co/manga/gachiakuta" style="color: #2563eb;">https://www.mangapulse.co/manga/gachiakuta</a> (<em>Gachiakuta</em>)</li>
  </ul>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">1. Factual Clarification &amp; Non-Infringement</h3>
  <p>MangaPulse is <strong>NOT</strong> an online reader, aggregator, or scanlation host. We <strong>DO NOT host, rip, stream, store, or display any copyrighted manga pages, scans, raw images, or downloadable files</strong> on our servers.</p>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">2. Purpose of MangaPulse</h3>
  <p>MangaPulse operates strictly as:</p>
  <ul>
    <li>A release schedule countdown timer and catalog tracking official publisher dates.</li>
    <li>A personal reading log allowing readers to check off their volume and chapter reading progress.</li>
    <li><strong>An official publisher directory:</strong> All outbound reading and purchasing buttons redirect users exclusively to authorized platforms—specifically <strong>Kodansha&rsquo;s official K Manga service</strong> (<a href="https://kmanga.kodansha.com">kmanga.kodansha.com</a>), Shueisha (MANGA Plus), Viz Media, and authorized retailers (BookWalker/Amazon).</li>
  </ul>
  <p>Our platform actively funnels prospective readers away from pirate scanlation sites and directly into Kodansha&rsquo;s authorized commercial platforms.</p>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">3. Action Requested</h3>
  <p>Because zero infringing material is hosted on MangaPulse, we respectfully request that comeso GmbH:</p>
  <ol>
    <li>Submit an expedited retraction/withdrawal of <strong>Lumen Notice 104048545</strong> to Google Search to restore the affected indexing.</li>
    <li>Add the domain <code>mangapulse.co</code> (and <code>www.mangapulse.co</code>) to your automated crawler exclusion/whitelist to prevent repeated false-positive notices against our verified legal directory.</li>
  </ol>

  <p>Our published DMCA &amp; Zero-Image-Hosting compliance policy is available at: <a href="https://mangapulse.co/dmca" style="color: #2563eb;">https://mangapulse.co/dmca</a></p>

  <p>If your team requires any further verification, please feel free to reply directly to this communication.</p>

  <p>Thank you for your prompt assistance and cooperation.</p>

  <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
    <strong>MangaPulse Administration &amp; Compliance Team</strong><br/>
    Website: <a href="https://mangapulse.co" style="color: #2563eb;">https://mangapulse.co</a><br/>
    Official Email: dmca@mangapulse.co
  </div>
</div>
`;

async function send() {
  const payload = {
    from: "MangaPulse Compliance <dmca@mangapulse.co>",
    to: ["dmca@comeso.org", "info@comeso.org"],
    bcc: ["mehakiqbal974@gmail.com"],
    reply_to: "mehakiqbal974@gmail.com",
    subject: "URGENT: Notice Retraction & Whitelist Request – Lumen Notice 104048545 – MangaPulse.co",
    text: textContent,
    html: htmlContent,
  };

  console.log("Sending email via Resend API...");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Resend API Response Status:", res.status);
  console.log("Resend API Response Data:", JSON.stringify(data, null, 2));
}

send().catch(err => {
  console.error("Error sending email:", err);
  process.exit(1);
});
