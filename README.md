# pacificislandventures.com

Landing site for Pacific Island Ventures (used goods resale + app & game development),
with a Space Traders game page and a closed-beta signup that captures verified Google emails.

Hosted on **GitHub Pages** from this repo. Domain registered at **Squarespace**.

## Pages

| Path | Purpose |
|---|---|
| `/` | Umbrella portal — deliberately vague, doors into each venture |
| `/resale/` | Resale & Buyouts venture page (bulk trading cards, estate/collection buyouts) |
| `/space-traders/` | Space Traders game page |
| `/beta/` | Closed beta signup (Sign in with Google) |

**TODO**: the "Browse our current lots" button on `/resale/` needs the local auction
site URL (marked with a `TODO(shawn)` comment in `resale/index.html`).

## One-time setup

### 1. DNS at Squarespace (points the domain at GitHub Pages)

Squarespace → **Domains** → pacificislandventures.com → **DNS Settings**:

1. Delete any existing Squarespace-default **A** records on `@` (they point the domain at Squarespace).
2. Add four **A** records, host `@`, one per value:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Add a **CNAME** record: host `www` → `shawnfirth86-sys.github.io`
4. Wait for DNS to propagate (minutes to a few hours), then in the repo's
   **Settings → Pages** confirm the custom domain shows a green check and tick
   **Enforce HTTPS** (the certificate appears automatically, can take up to an hour).

### 2. Beta signup — Google OAuth client (~5 min)

The beta page uses "Sign in with Google", so signups are always real, verified Google accounts.

1. Go to https://console.cloud.google.com/ (sign in with the Google account that should own this).
2. Create a project (e.g. `space-traders-beta`).
3. **APIs & Services → OAuth consent screen**: External, app name "Space Traders Beta",
   add your support email, save through the steps (no scopes needed), then **Publish app**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Type: **Web application**
   - Authorized JavaScript origins:
     - `https://pacificislandventures.com`
     - `https://www.pacificislandventures.com`
     - `https://shawnfirth86-sys.github.io` (fallback/testing)
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`).

### 3. Beta signup — Google Sheet + Apps Script (~5 min)

1. Create a new Google Sheet named e.g. **Space Traders Beta Signups**.
2. In the Sheet: **Extensions → Apps Script**. Delete the stub code and paste in
   [`apps-script/Code.gs`](apps-script/Code.gs).
3. In the pasted code, set `CLIENT_ID` to the Client ID from step 2.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorize when prompted, then copy the **Web app URL** (ends in `/exec`).
6. Sanity check: open that URL in a browser — you should see `{"ok":true,...}`.

### 4. Wire the site up

Edit [`assets/config.js`](assets/config.js): paste the Client ID and the `/exec` URL.
Commit and push. Done — signups appear as rows in the Sheet (timestamp, email, name),
deduplicated by email.

### 5. Contact emails

The site uses two addresses. Squarespace domains include free email forwarding
(**Domains → pacificislandventures.com → Email → Email forwarding**):

- `contact@pacificislandventures.com` — umbrella + resale contact (portal and `/resale/`)
- `play@pacificislandventures.com` — Space Traders + beta contact (`/space-traders/` and
  `/beta/`), and the address beta invites/build announcements are sent from

Forward both to your real inbox. To *send* beta mail as `play@`, add it as a send-as
alias in Gmail (Settings → Accounts → "Send mail as") once forwarding works.

## How the signup stays trustworthy

- The browser gets a signed **ID token** from Google, not a typed-in email.
- The Apps Script sends the token to Google's `tokeninfo` endpoint, which checks the
  signature and expiry; the script then checks the token was issued for **this** site's
  Client ID and that `email_verified` is true, before writing the row.
- So a row in the Sheet means: a real person, signed into a real Google account,
  clicked the button on your page. Nothing self-reported.

## Local preview

Any static server works, e.g. `python -m http.server` from the repo root.
Note the Google button only renders on origins listed in the OAuth client
(add `http://localhost:8000` there if you want to test sign-in locally).
