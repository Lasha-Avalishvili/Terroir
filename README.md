# Terroir — from vineyard to bottle

WINOTHON 2026 · Gurjaani. Two parts, one site:

- **MyVineyard** (Challenge 3.4) — React + Vite + TypeScript app in `src/`: plots, rows and numbered bays, work log, field reports, weather, AI advice. English / Georgian.
- **MyCellar** (Challenge 3.1) — standalone page in `public/cellar.html`: wine lots, 3D cellar, traceability, costs.

The home page (`index.html`) lets the user choose MyVineyard or MyCellar.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:5173

## Deploy on Netlify

Netlify reads `netlify.toml`: build command `npm run build`, publish folder `dist`.
`public/cellar.html` is copied to `dist/cellar.html` automatically.

## Shared data model

`src/shared/models.ts` — a harvest record carries `variety` and `batchId`; that batch is the hand-off from MyVineyard to MyCellar.

Demo data only — not real winery records.
