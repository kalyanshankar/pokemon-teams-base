# Team Base

A personal library for Pokémon Champions VGC teams. Paste a pokepast.es link or a Showdown export and it fills in the Pokémon, items, abilities, moves and auto tags (Trick Room, Tailwind, Sun, Mega, and so on), with Mystery Dungeon portraits and sprites.

- Only the paste is required. Title, player, source link, replica code, format, rating, tags and notes are optional.
- Filters: must include all, include at least one, exclude, items, moves, tags, player, rating. Filters live in the URL, so you can bookmark a search.
- Duplicate check: warns when a new team has the same replica code, or the same Pokémon with the same items, abilities and moves. If only the six species match, it shows what differs instead of calling it a duplicate. EV/stat spreads don't count toward duplicates.

## Try it first (no setup)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). Without Supabase keys the app runs in **demo mode**: teams save in that browser only. Good for kicking the tires.

---

## Step 1: Create the Supabase database (about 10 minutes)

Supabase's dashboard gets redesigned now and then, so button names below may be slightly different. The flow stays the same.

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub sign-in is easiest).
2. Click **New project**.
   - Name: `team-base`
   - Database password: click **Generate**, then save it in your password manager. The app never uses it, but you'd want it for direct database access later.
   - Region: pick one near you (for Texas, a US East or US Central region).
   - Plan: **Free**.
   - Click **Create new project** and wait a minute or two while it sets up.
3. **Create the table.** In the left sidebar open **SQL Editor**, click **New query**, paste the whole contents of `supabase/schema.sql` from this folder, and click **Run**. You should see "Success. No rows returned".
   - Check it worked: open **Table Editor** in the sidebar. A `teams` table should be listed.
4. **Turn off public sign-ups** so nobody else can make an account on your database. Open **Authentication**, then **Sign In / Providers** (sometimes under **Settings**). Switch off **Allow new users to sign up** and save.
5. **Create your login.** Open **Authentication > Users**, click **Add user > Create new user**, enter your email and a password, tick **Auto Confirm User**, and create it. This is the email and password you'll type into the app.
6. **Copy your two keys.** Click **Connect** at the top of the project page, or open **Project Settings > API Keys** (the URL is under **Project Settings > Data API**). You need:
   - **Project URL**, looks like `https://abcdefgh.supabase.co`
   - **Publishable key** (starts with `sb_publishable_`). On older projects this is called the **anon public** key. Either works.

   Never use the **secret** or **service_role** key in this app. The publishable key is safe in a website because the security rules in `schema.sql` only let your signed-in account read or change teams.

7. **Point the app at Supabase.** In this folder, copy `.env.example` to `.env.local` and fill in:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_KEY=sb_publishable_...
   ```

8. Restart `npm run dev`. You should now see a sign-in screen. Sign in with the user from step 5 and add a team. It will appear in **Table Editor > teams** on Supabase.

**Heads-up on the free plan:** Supabase pauses free projects after roughly a week with no activity. Your data stays; you click **Restore project** on the dashboard and it's back in a minute or two. Using the app now and then keeps it awake.

---

## Step 2: Host it for free so it works on your phone (about 10 minutes)

We'll use GitHub (stores the code) and Vercel (hosts the site free and redeploys automatically when you change code).

1. **Put the code on GitHub.**
   - Create a free account at [github.com](https://github.com) if you don't have one.
   - Click **New repository**, name it `team-base`, set it to **Private**, and create it without a README.
   - In this folder, run (replace `YOUR-NAME`):

     ```bash
     git init
     git add .
     git commit -m "Team Base"
     git branch -M main
     git remote add origin https://github.com/YOUR-NAME/team-base.git
     git push -u origin main
     ```

     `.env.local` is ignored by git, so your keys don't get uploaded.
2. **Deploy on Vercel.**
   - Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (the free Hobby plan is fine).
   - Click **Add New > Project**, find `team-base`, click **Import**.
   - Vercel detects **Vite** on its own. Leave build settings as they are.
   - Open **Environment Variables** and add the same two values from your `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_KEY`
   - Click **Deploy**. In about a minute you get a link like `team-base-yourname.vercel.app`.
3. **On your phone,** open that link, sign in, then use **Add to Home Screen** (Safari share menu, or Chrome's menu) so it opens like an app.

From now on, any change pushed to GitHub redeploys automatically. If you change the environment variables in Vercel later, redeploy from the **Deployments** tab so they take effect.

---

## How it works

| Piece | What it does |
| --- | --- |
| `supabase/schema.sql` | One `teams` table. Each row keeps the raw paste plus parsed `members` (JSON) and `species`, `items`, `moves`, `auto_tags` arrays for filtering. Row-level security limits every row to its owner. |
| `src/lib/parse.js` | Reads Showdown/pokepaste text with `@pkmn/sets`, keeps each Pokémon's original text block and spread lines (EVs or Stat Points), detects Megas from held stones, builds auto tags and a duplicate fingerprint. |
| `vercel.json`, `vite.config.js` | Forward `/pp/...` to pokepast.es so the browser reads paste links through your own site. Browsers block many cross-site requests, and this sidesteps that whatever pokepast.es allows. |
| `src/lib/dex.js` + `src/data/spriteMap.json` | Maps each species and form to its PMD Sprite Repository folder. Cards use PMD portraits; the team view plays the animated idle sprite. |
| `src/lib/filters.js` | All filtering runs in the browser, so it's instant for a personal-sized library. |

### Refreshing sprites

PMD artists add new forms over time. To pick them up:

```bash
npm run sprites
```

Then commit and push. A form PMD doesn't have yet falls back to the base Pokémon's art.

### Tests

```bash
npm test
```

Checks the parser, Mega detection, auto tags, duplicate rules and sprite coverage on a sample team.

## Credits

Pokémon portraits and sprites come from the [PMD Sprite Repository](https://sprites.pmdcollab.org/), made by community artists credited there. Item icons and Pokémon data come from Pokémon Showdown via the `@pkmn` libraries. Pokémon is © Nintendo, Creatures and Game Freak. This is a personal, non-commercial tool.
