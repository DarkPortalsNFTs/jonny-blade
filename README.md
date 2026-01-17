# Jonny Blades (Blade AI)

Jonny Blades is a premium one-page e-commerce, loyalty, and franchise experience built on a Blade AI concierge and a capacitive-ready PWA shell.

## Key features
- **Products + checkout** – Four signature grooming essentials (Precision Razor, Rich Shaving Cream, Beard Oil, Styling Pomade) rendered in the shop and franchise spotlight with Stripe Checkout.
- **Blade AI + Rewards** – Local SQLite knowledge base, search analytics, and rewards members (signup/login/add points) with admin tooling (`/admin`).
- **Franchise storytelling** – Premium hero, animated slider, product grid, and franchise/career content that spells out the offer, kit, and expectations.
- **PWA + native wrapper ready** – Manifest + service worker + install banners, offline fallback (`/offline.html`), and Capacitor config/scripts for future Android/iOS apps.
- **Admin tooling** – JADE admin page (Blade search index/editor, analytics, members, add points) powered by `public/js/admin.js`.

## Quick start
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`. If port 3000 is in use run `PORT=4xxx npm run dev` or stop the other process.

## Environment setup
Copy the example file and add keys:
```bash
cp .env.example .env
```
- Required: `STRIPE_SECRET_KEY`
- Optional: `BLADE_ADMIN_TOKEN`, `PORT`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`

## Blade AI learning & search
- Blade learns via `POST /api/learn` (admin token required).
- Search: `POST /api/assist` (Blade uses `ai/site-content.json`).
- Admin updates: `GET /api/site-content`, `POST /api/site-update`.
- Analytics: `GET /api/analytics` (admin token only).

## Rewards program
- Sign up: `POST /api/rewards/signup`.
- Login: `POST /api/rewards/login` (returns current points).
- Add points / list members: admin endpoints under `/api/rewards/
`.

## Franchise & careers showcase
1. Franchise slider combines brand/operations visuals plus location callouts (Morriston, Gorseinon, Skewen).
2. Product grid sits inside the franchise deck to highlight the signature line.
3. Career grid spells out barber opportunities and the ideal partner profile.
4. CTA buttons email `franchise@jonnyblades.com` or `careers@jonnyblades.com`, matching the site copy you shared.

## PWA + install notes
- Manifest: `public/manifest.webmanifest` lists `logo-192.png` and `logo-512.png`.
- Service worker: `public/js/sw.js` caches the home page, CSS/JS, franchise visuals, and offline page (`/offline.html`).
- Install UI: `public/js/main.js` manages Chrome install banners, iOS hints, floating CTA, and back-to-top.

## Native wrapper (Capacitor)
1. Adjust `capacitor.config.json` server URL for prod.
2. Add platforms:
```bash
npm run cap:android
npm run cap:ios
```
3. Open each platform:
```bash
npm run cap:open:android
npm run cap:open:ios
```

## System setup tips
1. After `npm install`, always run `npm run dev`.
2. Use `nodemon` (already in devDependencies) for live reloads.
3. Stop the dev server on port 3000 before re-running (`pkill -f nodemon` or `lsof -i :3000`).
4. The archive `/home/security/jonny-blades.zip` contains the current code + assets if you want to push it elsewhere.

## Folder structure
```
jonny-blades/
  ai/
    blade.js
    blade.db
    site-content.json
  public/
    css/style.css
    js/main.js
    js/admin.js
    js/sw.js
    manifest.webmanifest
    offline.html
    images/
      hero.svg
      product-*.svg
      franchise-*.svg
      logo-*.png
      location-*.svg
  views/
    index.ejs
    admin.ejs
  server.js
  capacitor.config.json
  README.md
  package.json
  package-lock.json
```

## Deployment (Render or similar)
1. Build command: `npm install`.
2. Start command: `npm start`.
3. Provide Stripe keys and Blade admin token through env.

## Support
Email: DarkPortalsNFTs@gmail.com
