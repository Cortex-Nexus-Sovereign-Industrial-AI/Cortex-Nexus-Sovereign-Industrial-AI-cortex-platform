# Supabase Auth setup for Cortex

This repository uses Supabase Auth for sign-up, sign-in, persisted sessions, and sign-out. The application intentionally fails closed until the project configuration is supplied.

## Required setup

1. In Supabase, open **Project Settings → API** and copy the **Project URL** and the **public anon/publishable key**.
2. Replace the placeholders in `supabase-config.js` with those values. Never use the `service_role` key in browser code or commit it to GitHub.
3. In **Authentication → URL Configuration**, set the production Site URL to `https://cortex-platforms.netlify.app` and add that URL (and any approved local development URL) to Redirect URLs.
4. Configure email confirmation and password policies to suit the project.
5. Enable Row Level Security (RLS) on every table containing user or business data and create least-privilege policies.
6. Test sign-up, email confirmation, wrong-password rejection, session refresh, and sign-out in a staging deployment before merging/deploying.

## Important security boundary

Supabase Auth verifies identity, but it does not automatically secure dashboard actions, payment records, or data/API endpoints. Do not store sensitive data or treat client-side state as authorization. Protect future data operations server-side and with RLS. Guest bypass is disabled.

## Deployment note

This PR changes the static frontend and Content Security Policy only. It does not configure your Supabase project, publish keys, merge the PR, or deploy Netlify.
