// Cloudflare Pages Function (POST /api/submit-form)
/* Inline comments in English: Cloudflare Pages provides env via the function context */
export async function onRequestPost({ request, env }) {
  try {
    const {
      email,
      isTreasurer,
      organization,
      assets,
      handle,
      betaAgreed,
      privacyAgreed,
      comment: commentInput,
    } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseComment = `Treasurer: ${isTreasurer ? "Yes" : "No"}, Assets: ${assets || "Not specified"}`;
    const comment = commentInput ? `${baseComment}; ${commentInput}` : baseComment;

    if (comment.length > 150) {
      return new Response(JSON.stringify({ error: "Comment too long (max 150 characters)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toISOString();
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "Unknown";
    const userAgent = request.headers.get("User-Agent") || "Unknown";
    const country = request.headers.get("CF-IPCountry") || "Unknown";
    const referer = request.headers.get("Referer") || "Direct";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
    const language = request.headers.get("Accept-Language") || "Unknown";

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.notion_api}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: "19727ba82ccc8017b4d8f2825a4d4895" },
        properties: {
          Email: {
            title: [{ text: { content: email } }],
          },
          Timestamp: { date: { start: timestamp } },
          IP: { rich_text: [{ text: { content: ip } }] },
          UserAgent: { rich_text: [{ text: { content: userAgent } }] },
          Country: { rich_text: [{ text: { content: country } }] },
          Referer: { rich_text: [{ text: { content: referer } }] },
          Timezone: { rich_text: [{ text: { content: timezone } }] },
          Language: { rich_text: [{ text: { content: language } }] },
          Comment: { rich_text: [{ text: { content: comment || "" } }] },
          Organization: { rich_text: [{ text: { content: organization || "" } }] },
          Handle: { rich_text: [{ text: { content: handle || "" } }] },
          BetaAgreed: { checkbox: !!betaAgreed },
          PrivacyAgreed: { checkbox: !!privacyAgreed },
        },
      }),
    });

    if (!notionResponse.ok) {
      const details = await notionResponse.text();
      return new Response(JSON.stringify({ error: "Failed to save to Notion database", details }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 