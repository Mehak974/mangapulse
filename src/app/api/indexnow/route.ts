import { NextRequest, NextResponse } from "next/server";
import { submitToIndexNow, INDEXNOW_KEY, INDEXNOW_HOST } from "@/lib/indexnow";
import { fetchPopular, getFallbackMangaList } from "@/lib/anilist";

export async function GET() {
  const baseUrl = `https://${INDEXNOW_HOST}`;

  return NextResponse.json({
    status: "ready",
    protocol: "IndexNow",
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
    verificationUrls: [
      `${baseUrl}/${INDEXNOW_KEY}.txt`,
      `${baseUrl}/indexnow.txt`,
    ],
    documentation: "https://www.indexnow.org/documentation",
    instruction: "Send a POST request with { urls: string[] } or empty body to submit top indexed URLs.",
  });
}

export async function POST(req: NextRequest) {
  try {
    let urlsToSubmit: string[] = [];

    try {
      const body = await req.json();
      if (body && Array.isArray(body.urls) && body.urls.length > 0) {
        urlsToSubmit = body.urls;
      }
    } catch {
      // Body empty, will default to core URLs
    }

    const baseUrl = `https://${INDEXNOW_HOST}`;

    // If no custom URLs were supplied, automatically submit the site core and trending manga
    if (urlsToSubmit.length === 0) {
      const coreUrls = [
        baseUrl,
        `${baseUrl}/trending`,
        `${baseUrl}/browse`,
        `${baseUrl}/dashboard`,
        `${baseUrl}/donate`,
        `${baseUrl}/forum`,
      ];

      let mangaList = [];
      try {
        mangaList = await fetchPopular(1, 30);
      } catch {
        mangaList = getFallbackMangaList();
      }

      const mangaUrls = (mangaList || []).flatMap((m) => [
        `${baseUrl}/manga/${m.slug}`,
        `${baseUrl}/release-date/${m.slug}`,
      ]);

      urlsToSubmit = [...coreUrls, ...mangaUrls];
    }

    const result = await submitToIndexNow(urlsToSubmit);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.message,
      submittedCount: result.submittedCount,
      host: INDEXNOW_HOST,
      sampleUrls: urlsToSubmit.slice(0, 5),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
