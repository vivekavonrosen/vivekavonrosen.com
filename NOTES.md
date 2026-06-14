# vivekavonrosen.com — Project Notes

Static HTML site in `site/`, deployed on Vercel, repo `github.com/vivekavonrosen/vivekavonrosen.com`.
Live at **www.vivekavonrosen.com** (apex 308→www, SSL good). Auto-deploys on push to `main`.
Deploy manually with: `npx vercel deploy --prod --yes` from project root.

## Key facts
- Brand: purple `#571F81` / gold `#DFB24A` / teal `#2C97AF` / cream `#FAF6EE`; Bebas Neue + Lato + Playfair.
- Pages: index, work-with-me, about, speaking, events, books, podcast, press, contact, blog. Shared styles in `site/css/styles.css`; entrance in `site/js/quantum.js`.
- **speaking.html is the exception** — fully self-contained (its own `<style>`), replicated from her vibecoded speaker page. Global style changes do NOT reach it.
- Photo library: `/Users/vivekavonrosen/Documents/Claude Cowork/IMages ` (note trailing space). Image-processing utility `remove_bg.py` (gitignored); PIL/numpy/scipy + standalone `ffmpeg` installed. No Homebrew on machine.
- Real links: Calendly discovery `calendly.com/vivekacoach/discovery-call`; Calendly speaking `calendly.com/vivekacoach/speaking-inquiry`; Skool `skool.com/womens-tech-collaborative-2106`; VIOS `visibilityos.tech`; YouTube `youtube.com/@Viveka_von_Rosen`; Substack `vivekavonrosen.substack.com`.

## Working
- Entrance: purple starfield + her real gold scrollwork backdrop (`scrollwork-bg.png`, mirrored top+bottom); tech words form above her name starting VIOS, cycle once (~21s), settle on the phoenix (sampled from `phoenix-mark.png`) and hold. Click = fast ~0.85s vortex → navigate ("I'm Ready for Traction"→work-with-me, "Show Me Around First"→home). Plays once/session, skippable, reduced-motion safe.
- Interior polish: portal dark sections (stars + scroll corners + ghost phoenix), card gold edges + hover, gold-pill CTAs, link underline sweeps, rung numbers 01/02/03, flourish dividers, branded photos on About + Work With Me.
- Articles page pulls live Substack posts via serverless `api/substack.js` (edge-cached 1hr, auto-updates, no redeploy).
- Speaking page: full replica with scrolling "As Seen In" marquee, 3 keynote cards, 4-image gallery (orange-jacket shot anchored top so head shows), downloadable one-sheet PDF at `site/files/`, site nav+footer added.
- Logo (phoenix bird) in every header + footer + favicon.

## Still broken / open
- Footer "Privacy Policy" + "Terms & Conditions" links are `#` placeholders (no pages yet).
- Old blog archive (63 beyondthedreamboard posts) not migrated — Articles page is Substack-only by design.
- Podcast page Spotify/Apple buttons still point to the old beyondthedreamboard grey-matters page.
- Speaking page contact email is `viveka@beyondthedreamboard.com` (she hasn't activated `viveka@vivekavonrosen.com` yet) — swap site-wide when she does.
- Grey-hair photo (`viv-grey.jpg`) processed but not placed anywhere.
- Her image folder has unused landing-page mockups (VVR landing page V2/V3, Home page mock up V1).

## Next step
Pick up wherever she directs. Likely candidates: (1) build real Privacy/Terms pages, (2) activate + swap the vivekavonrosen.com email, (3) fix podcast Spotify/Apple links, or (4) more design tweaks. No blocking issues — site is fully live.

---

## Session Log

### 2026-06-14
Built the whole site this stretch. Highlights: deployed to www.vivekavonrosen.com and fixed the GoDaddy forwarding/DNS + SSL; redesigned the entrance several times landing on the starfield→phoenix version with her real gold scrollwork backdrop (she rejected a spinning-vortex redesign — reverted it); did interior visual passes 1–6 (portal sections, imagery, cards, buttons, rung numbers, dividers); wired Substack RSS into the Articles page via serverless function; doubled eyebrow/rung-label sizes; rebuilt the Speaking page twice — final version is a verbatim replica of her vibecoded speaker page (scrolling marquee, keynotes, one-sheet PDF, orange-jacket gallery image fixed to show her head). Repo restructured into `site/` and connected to Vercel for auto-deploy. Ended: site fully live, no blockers.
