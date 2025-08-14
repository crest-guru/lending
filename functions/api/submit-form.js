/* Cloudflare Pages Function: /api/submit-form */
/* English comments only inside code */
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (method === 'GET') return json({ ok: true, msg: 'Use POST to submit form' }, 200, CORS);
  if (method !== 'POST') return json({ error: 'Method not allowed' }, 405, CORS);

  try {
    // Parse body safely
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, CORS);
    }

    // Accept both old and new client field names
    const emailRaw = (body.email ?? '').toString();
    const email = emailRaw.trim();

    const checkbox = Boolean(
      body.checkbox ?? body.privacyAgreed ?? false
    );
    const organisation = (body.organisation ?? body.organization ?? '').toString();
    const treasure = Boolean(
      body.treasure ?? body.isTreasurer ?? false
    );
    const tg = (body.tg ?? body.handle ?? '').toString();
    const commentInput = (body.comment ?? '').toString();

    if (!email) return json({ error: 'Email is required' }, 400, CORS);

    const comment = commentInput || '';
    if (comment.length > 150) {
      return json({ error: 'Comment too long (max 150 characters)' }, 400, CORS);
    }

    const timestamp = new Date().toISOString();
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'Unknown';
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const country = request.headers.get('CF-IPCountry') || 'Unknown';
    const referer = request.headers.get('Referer') || 'Direct';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
    const language = request.headers.get('Accept-Language') || 'Unknown';

    // Env fallbacks
    const NOTION_TOKEN = env.notion_api || env.NOTION_API || env.NOTION_TOKEN;
    const NOTION_DB = env.notion_db || env.NOTION_DB || '19727ba82ccc8017b4d8f2825a4d4895';
    const TIMEOUT_MS = Number(env.NOTION_TIMEOUT_MS || 12000);

    if (!NOTION_TOKEN) {
      return json({ error: 'Notion token is not configured (set NOTION_API)' }, 500, CORS);
    }
    if (!NOTION_DB) {
      return json({ error: 'Notion database id is not configured (set NOTION_DB)' }, 500, CORS);
    }

    // Timeout protection for Notion request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB },
        properties: {
          Email: { title: [{ text: { content: email } }] },
          Checkbox: { checkbox: !!checkbox },
          Organisation: { rich_text: [{ text: { content: organisation || '' } }] },
          treasure: { checkbox: !!treasure },
          tg: { rich_text: [{ text: { content: tg || '' } }] },
          Comment: { rich_text: [{ text: { content: comment } }] },
          Timestamp: { date: { start: timestamp } },
          IP: { rich_text: [{ text: { content: ip } }] },
          UserAgent: { rich_text: [{ text: { content: userAgent } }] },
          Country: { rich_text: [{ text: { content: country } }] },
          Referer: { rich_text: [{ text: { content: referer } }] },
          Timezone: { rich_text: [{ text: { content: timezone } }] },
          Language: { rich_text: [{ text: { content: language } }] },
        },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!notionResponse.ok) {
      const details = await notionResponse.text().catch(() => '');
      const status = notionResponse.status || 500;
      return json({ error: 'Failed to save to Notion database', status, details }, status, CORS);
    }

    return json({ success: true }, 200, CORS);
  } catch (err) {
    // Return 504 on timeout abort, 500 otherwise
    const isAbort = err && (err.name === 'AbortError' || err.message === 'The user aborted a request.');
    const status = isAbort ? 504 : 500;
    return json({ error: isAbort ? 'Upstream timeout' : 'Server error' }, status, CORS);
  }
}