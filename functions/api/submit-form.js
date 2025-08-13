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
};

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (method === 'GET') return json({ ok: true, msg: 'Use POST to submit form' }, 200, CORS);
  if (method !== 'POST') return json({ error: 'Method not allowed' }, 405, CORS);

  try {
    const {
      email,
      checkbox,
      organisation,
      treasure,
      tg,
      comment: commentInput,
    } = await request.json();

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

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.notion_api}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: '19727ba82ccc8017b4d8f2825a4d4895' },
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
    });

    if (!notionResponse.ok) {
      const details = await notionResponse.text();
      return json({ error: 'Failed to save to Notion database', details }, 500, CORS);
    }

    return json({ success: true }, 200, CORS);
  } catch {
    return json({ error: 'Server error' }, 500, CORS);
  }
}