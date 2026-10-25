// CINIS NEXUS AI — Conversational Backend
// Deploy: Cloudflare Workers & Pages.
// Configure ANTHROPIC_API_KEY as a Worker secret, never as a client-side value.
// Security note: this Worker is not an authentication system. Add durable edge
// rate limiting (e.g. a Cloudflare rate-limiting rule) before public production use.

const SYSTEM_PROMPT = `You are CINIS NEXUS AI, the voice and chat companion on the CINIS NEXUS INDUSTRY OGOJA platform — an AI-powered intelligence hub in Ogoja, Cross River State, Nigeria, founded by Michael Ujuku Morim.

You are a genuine open-knowledge learning companion. Teach, explain, and discuss any topic a curious person brings — science, history, farming, business, technology, current events, anything — the way a knowledgeable, warm human tutor would. Do NOT limit yourself to only platform topics. If someone asks something totally unrelated to CINIS, just answer it well and helpfully, like a real teacher would.

Background context on the platform (mention only when relevant, don't force it in):
- Community Directory (free listing for businesses/farmers/government/NGOs)
- Market intelligence, agricultural data, funding connections
- Education Hub (AI literacy, business, farming, trading, marketing, cyber security)
- Plans: Community (free), Professional (₦5,000/mo), Enterprise (₦15,000/mo)

Speak naturally and conversationally — never robotic, never a fixed script. Keep spoken answers to 2-4 sentences unless the person clearly wants more depth, since this may be read aloud. Only defer to cortexnexus@proton.me for platform-specific facts (billing, account issues) you're genuinely unsure of — for general knowledge, just answer directly and confidently. Never ask for, infer, or process biometric, gender, or identity information about who is speaking.`;

const ALLOWED_ORIGINS = new Set([
  'https://cortex-platforms.netlify.app'
]);

const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_BYTES = 4096;
const UPSTREAM_TIMEOUT_MS = 15000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = securityHeaders(origin);

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin)) {
        return new Response(null, { status: 403, headers });
      }
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '600');
      return new Response(null, { status: 204, headers });
    }

    if (origin && !isAllowedOrigin(origin)) {
      return json({ error: 'Origin not allowed' }, 403, headers);
    }

    if (request.method !== 'POST') {
      headers.set('Allow', 'POST, OPTIONS');
      return json({ error: 'Method not allowed' }, 405, headers);
    }

    if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, 415, headers);
    }

    const declaredLength = Number(request.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ error: 'Request body too large' }, 413, headers);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'AI service is not configured' }, 503, headers);
    }

    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
        return json({ error: 'Request body too large' }, 413, headers);
      }

      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return json({ error: 'Invalid JSON body' }, 400, headers);
      }

      const message = payload?.message;
      if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
        return json({ error: 'Message must be a non-empty string of at most 500 characters' }, 400, headers);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
      let apiRes;
      try {
        apiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 220,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: message.trim() }]
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!apiRes.ok) {
        // Do not forward provider error details or secrets to clients.
        return json({ error: 'AI provider request failed' }, 502, headers);
      }

      const data = await apiRes.json();
      const reply = data?.content?.find(item => item?.type === 'text')?.text;
      if (typeof reply !== 'string' || !reply.trim()) {
        return json({ error: 'AI provider returned an empty response' }, 502, headers);
      }

      return json({ reply }, 200, headers);
    } catch (err) {
      if (err?.name === 'AbortError') {
        return json({ error: 'AI provider timed out; please try again' }, 504, headers);
      }
      return json({ error: 'Server error' }, 500, headers);
    }
  }
};

function isAllowedOrigin(origin) {
  // Non-browser callers may omit Origin; this is not authentication.
  return typeof origin === 'string' && ALLOWED_ORIGINS.has(origin);
}

function securityHeaders(origin) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Vary': 'Origin'
  });

  if (isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
