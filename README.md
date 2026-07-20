<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9575a4b4-b74c-4322-bf76-abaf4f4d70bd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`, then set `VITE_SUPABASE_PUBLISHABLE_KEY`
   with the public key from the Supabase project **Connect** dialog.
3. Run [`supabase/bolt_shifts.sql`](supabase/bolt_shifts.sql) once in the Supabase SQL editor.
4. Run the app:
   `npm run dev`

# Bolt
