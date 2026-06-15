# Swiss / Italia Family Trip Guide

A mobile-first static itinerary built with Vite, React, Leaflet, and OpenStreetMap.
All trip content, map locations, route lines, and filters live in
`src/data/itinerary.json`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

The included GitHub Actions workflow deploys every push to `main`.

1. Push the project to a GitHub repository.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`, or run the workflow manually from the Actions tab.

Vite uses a relative base path, so the site works for both user pages and
project pages without editing the repository name.
