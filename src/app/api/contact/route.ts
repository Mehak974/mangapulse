import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Direct to the specific verified domain email based on category
    let toEmail = "contact@mangapulse.co";
    const cat = (category || "").toLowerCase();
    if (cat.includes("dmca") || cat.includes("legal") || cat.includes("copyright")) {
      toEmail = "dmca@mangapulse.co";
    } else if (cat.includes("support") || cat.includes("tech") || cat.includes("bug")) {
      toEmail = "support@mangapulse.co";
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MangaPulse Communications <contact@mangapulse.co>",
            to: [toEmail],
            reply_to: email.trim(),
            subject: `[${(category || "GENERAL").toUpperCase()}] ${subject.trim()}`,
            text: `New contact form submission from ${name.trim()} (${email.trim()}):\n\nCategory: ${category}\nSubject: ${subject}\n\nMessage:\n${message}`,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">New Inquiry via MangaPulse Contact Form</h2>
              <p><strong>Sender:</strong> ${name.trim()} (&lt;${email.trim()}&gt;)</p>
              <p><strong>Department:</strong> ${toEmail}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Subject:</strong> ${subject.trim()}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px;">${message.trim()}</div>
            </div>`,
          }),
        });
      } catch (sendErr) {
        console.error("Resend delivery failed:", sendErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
