# Akash Roofing Solution — Premium 3D (GitHub Pages ready)

Scroll-driven 3D roofing experience. Same content as akashroofingsolution.com, rebuilt premium.

## Run
npm install
npm run dev

## Build (static)
npm run build → `dist/` is deployable anywhere.

## GitHub Pages (custom domain)
1. Push to `main`. Workflow `.github/workflows/deploy.yml` builds + deploys.
2. Repo Settings → Pages → Custom domain: `akashroofingsolution.com` (CNAME already in `public/CNAME`).
3. DNS: A records to GitHub Pages + CNAME www → username.github.io (see GitHub docs).
4. Enforce HTTPS.

Project-page alternative (username.github.io/REPO): change `base` in `vite.config.js` to `/REPO/`.

## Content preserved
Home hero, mission/vision/technology, 11 services (Mangaluru, PUF, Glass Pergola, Shingles, Thatch, Nano Ceramic/Grano, Skylight, PEB, Gutter, False Ceiling, WPC), 4 features, 3-step process (new), Why Choose 5 points, stats, gallery, 9 testimonials, founder Mallesh KP 2008 story, contact 9663555041/9886262727 + gmail + Bangalore + Instagram, floating WhatsApp/Call/Top.
