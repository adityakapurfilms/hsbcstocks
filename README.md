# HSBC Stocks

A home-screen app for your portfolio. It reads the published HSBC tab of your
Google Sheet, so editing the sheet updates the app.

---

## What's in this folder

```
index.html              the app
styles.css              styling
app.js                  data + screens        ← the only file you'd ever edit
manifest.webmanifest    home-screen name and icon
sw.js                   lets the app open without a signal
.nojekyll               tells GitHub to serve the files as-is
icons/                  app icons
```

Keep all of these together. The app looks for them by relative path, so it
works whether it sits at the root of a site or inside a subfolder.

---

## Part 1 — Put the folder on your Windows computer

1. Unzip this folder somewhere you'll find it again, e.g. `Documents\hsbc-stocks`.
2. Install **GitHub Desktop** from <https://desktop.github.com> and sign in.
   (You can do all of this from a command line instead, but Desktop is fewer
   steps and harder to get wrong.)

---

## Part 2 — Create the repository

1. In GitHub Desktop: **File → New repository**.
2. Name: `hsbc-stocks`. Local path: the folder that *contains* your unzipped
   folder. Leave everything else at its defaults. Click **Create repository**.
3. Move the app files (`index.html`, `app.js`, `icons`, and the rest) so they
   sit **directly inside** the repository folder — not inside another folder
   within it. GitHub Desktop will immediately list them as changes.
4. In the bottom-left, type a summary like `First version` and click
   **Commit to main**.
5. Click **Publish repository** at the top.

   > Untick **Keep this code private**. GitHub Pages only works on public
   > repositories unless you pay for GitHub Pro. See the privacy note at the
   > bottom of this file before you do that.

---

## Part 3 — Turn on hosting

1. Go to your repository on github.com.
2. **Settings** tab → **Pages** in the left sidebar.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`,
   **Branch** to `main`, folder to `/ (root)`. Click **Save**.
4. Wait about a minute, then refresh the page. It'll show your live address:

   ```
   https://YOUR-USERNAME.github.io/hsbc-stocks/
   ```

Open that on your computer first to check it loads.

---

## Part 4 — Put it on your iPhone

1. Open that address in **Safari**. This only works in Safari — Chrome and
   Firefox on iOS can't install home-screen apps.
2. Tap the **Share** button (the square with an arrow, in the bottom bar).
3. Scroll down and tap **Add to Home Screen**.
4. The name will already read **Stocks**. Tap **Add**.

It appears on your home screen with the hexagon icon and opens fullscreen, with
no address bar or Safari controls.

---

## Part 5 — Making changes later

Edit the files on your computer, then in GitHub Desktop: write a summary,
**Commit to main**, then **Push origin**. The live site updates within a minute
or two.

On your phone the old version may linger for one launch because it's cached for
offline use. Close the app fully (swipe up from the app switcher) and reopen it.

---

## Using the app

- **Pull down** on the list to refresh from the Sheet.
- **Tap any holding** for its stats page. The back button, top-left, returns to
  the values list. The iPhone's edge-swipe-back gesture works too.
- **Gear icon** opens settings: force a refresh, or upload a CSV by hand.
- Holdings sort by value, highest first, automatically.
- Your last figures are saved on the phone, so it opens instantly and still
  shows something with no signal. If a refresh fails you'll see an "Offline"
  note under the total, so stale numbers are never mistaken for live ones.

---

## Adding a holding

Add the row to your Google Sheet as normal — it'll appear in the app on the next
refresh with no changes needed here.

To give it a working Tickertape button, add one line to the `TICKERTAPE` list
near the top of `app.js`:

```js
const TICKERTAPE = {
  NATIONALUM: "https://www.tickertape.in/stocks/national-aluminium-co-NALU",
  YOURSTOCK:  "https://www.tickertape.in/stocks/...",
};
```

The key is the NSE code without the `NSE:` prefix, exactly as it appears in
column B of your sheet.

---

## If the numbers won't load

The app keeps showing your last saved figures and flags itself as offline.
Usual causes:

- **The sheet was unpublished.** Re-publish it: in Google Sheets, **File →
  Share → Publish to web**, pick the **HSBC** tab, format **CSV**, Publish.
- **No signal.** It'll catch up on the next refresh.
- **A new published link.** Replace `CSV_URL` at the top of `app.js`.

As a stopgap, settings → **Upload a CSV file** loads the same data by hand.

---

## A privacy note worth reading

A public GitHub repository is readable by anyone who finds it, and `app.js`
contains the link to your published sheet. Nobody can *edit* anything, and your
Google account stays private — but someone who found the repo could see your
holdings and quantities.

Three ways to handle that, in order of effort:

1. **Accept it.** An unlinked repo with a generic name is unlikely to be found,
   though "unlikely" isn't "can't."
2. **Host on Netlify or Cloudflare Pages instead.** Both are free, both let you
   drag-and-drop this folder onto their site, and neither publishes your source.
   The iPhone steps in Part 4 are identical.
3. **Pay for GitHub Pro** (~$4/month) and keep the repository private with Pages
   still enabled.

Option 2 is the one I'd suggest if the exposure bothers you — it's no more work
than GitHub, and the resulting URL works exactly the same way.

---

## About the icon

The hexagon is an original mark drawn for this app, not HSBC's trademark. To
change it, replace the files in `icons/` keeping the same filenames and sizes.
