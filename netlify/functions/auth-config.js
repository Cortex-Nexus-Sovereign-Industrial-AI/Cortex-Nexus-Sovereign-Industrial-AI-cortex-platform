// Public Supabase client configuration only.
// SUPABASE_URL and SUPABASE_ANON_KEY are public client values, not service-role secrets.
// Never expose SUPABASE_SERVICE_ROLE_KEY in this response.
exports.handler = async function handler() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      body: JSON.stringify({ error: 'Authentication is not configured' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    body: JSON.stringify({ url, anonKey })
  };
};
