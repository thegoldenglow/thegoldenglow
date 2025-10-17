export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN' }) };
    }

    // Build a direct functions URL to avoid redirects
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers.host;
    const targetUrl = `${proto}://${host}/.netlify/functions/telegram-webhook`;

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetUrl)}`);
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ requested_url: targetUrl, result: data }) };
  } catch (err) {
    console.error('Set webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'Internal Error' }) };
  }
};