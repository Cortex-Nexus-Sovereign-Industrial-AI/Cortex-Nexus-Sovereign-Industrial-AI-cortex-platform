# Supabase authentication setup for CINIS

This branch integrates Supabase Auth into the Cortex browser app. It deliberately fails closed until the canonical Netlify site is configured.

## Required Netlify environment variables

Set these on the existing Netlify site `cortex-platforms` (production and any deploy context you intend to test):

- `SUPABASE_URL`: the Project URL from Supabase Project Settings → API.
- `SUPABASE_ANON_KEY`: the project's publishable/anon client key.

Do not set or expose the Supabase service-role key in the browser or this function.

## Supabase Auth settings

1. In Supabase Authentication → URL Configuration, set the Site URL to `https://cortex-platforms.netlify.app`.
2. Add `https://cortex-platforms.netlify.app/**` to allowed redirect URLs.
3. Keep email confirmation enabled unless you intentionally decide otherwise.
4. Enable appropriate password policy and configure SMTP/email delivery so confirmation messages reach users.
5. Review Row Level Security for every table before storing user data. Authentication alone does not protect tables without RLS policies.

## Important scope limits

- This implementation authenticates the UI and disables the guest bypass. It does not yet add server-side authorization to existing business/payment data or make local-only UI state private.
- Never treat a client-side user object as authorization. Netlify functions that access private data must validate the Supabase access token server-side.
- Do not merge/deploy until the actual project URL/key are configured and the login, sign-up, email confirmation, session restore, sign-out, and password-change flows have been tested.
