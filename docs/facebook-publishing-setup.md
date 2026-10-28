# Facebook Page publishing setup

AEOS queues eligible website content, publishes immediate posts from the server, and publishes scheduled posts through the Vercel Cron route. The Page access token is a server secret and must never be added to client code, a database row, or a chat message.

## 1. Install the database queue

Apply `supabase/migrations/054_facebook_publishing_queue.sql` to the same Supabase project used by the AEOS deployment. The migration adds Facebook publish options to the business content tables and creates a protected, deduplicated queue with publishing history.

## 2. Configure Meta Page access

In Meta for Developers, create/configure an app, add the Facebook Login and Pages capabilities as required by Meta's current setup, and authorize the official Alessandro Enterprises Page. Generate a Page access token with the Page publishing permission (`pages_manage_posts`) and any read permission required to select/inspect the Page. Follow Meta's current App Review and business verification requirements for the intended users.

Set these values in local `.env.local` for development and in the Vercel project's Production (and Preview if needed) environment variables:

```dotenv
FACEBOOK_PAGE_ID=61595623191488
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_GRAPH_API_VERSION=v26.0
CRON_SECRET=use_a_long_random_secret
NEXT_PUBLIC_SITE_URL=https://your-public-domain.example
```

Use the Page ID, not the Facebook profile URL, for `FACEBOOK_PAGE_ID`. Never commit the token or paste it into the browser. After adding or rotating environment variables, redeploy so the server and scheduled route load them.

## 3. Scheduled publishing

`vercel.json` calls `/api/cron/facebook-publisher` every five minutes. The route requires the `Authorization: Bearer <CRON_SECRET>` header Vercel sends for secured cron jobs. Vercel Hobby currently limits cron frequency to once per day; this five-minute schedule requires a plan that supports it. On local development, use **Run publisher now** in Website → Facebook publishing to process due posts manually.

## 4. How AEOS publishes

- Active products and services publish immediately by default when saved. The content form can disable Facebook posting or set an optional publish time.
- Announcements use their future website publish time when set; otherwise they publish immediately.
- Promotions use their future start time when set, unless a Facebook-specific time is provided.
- Repeated identical saves are deduplicated. Concurrent workers claim queue items safely.
- Temporary Meta errors are retried with backoff. Authorization errors pause the queue. Network timeouts and abandoned publisher work are sent to **Needs review** because Facebook may already have accepted the post; verify the Page before retrying.

Open **AEOS → Website → Facebook publishing** for connection readiness, queue history, manual processing, retries and cancellation.

## 5. Launch checklist

1. Apply migration 054.
2. Add the four Facebook/cron server secrets and the public site URL.
3. Confirm Meta granted the Page publishing permission and the token belongs to the correct Page.
4. Redeploy, open the Facebook publishing dashboard, and verify all connection checks.
5. Publish a low-risk test announcement, confirm the returned Page post appears, then test a future scheduled item.
6. Review the queue for failures and confirm that tokens never appear in browser network responses or application logs.
