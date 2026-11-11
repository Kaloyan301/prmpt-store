# PRMPT® — Collection 001

An immersive fashion archive and storefront built with React, TypeScript, Vite, Tailwind CSS v4, GSAP, Motion, and Three.js.

## Run locally

Install Node.js 20 or newer, open a terminal in this folder, and run:

```sh
npm install
npm run dev
```

Create a production build with `npm run build` and serve it with `npm run preview`.

## Publish on GitHub Pages

This repository is prepared to deploy automatically with GitHub Actions:

1. Create a new empty repository on GitHub.
2. Upload the project files (not the ZIP file itself) and commit them to the `main` branch.
3. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Build and deploy PRMPT to GitHub Pages** to finish. GitHub will show the live site URL in the deployment details.

The workflow builds the Vite app with the correct repository base path, then publishes the `dist` folder. You do not need to upload `node_modules` or `dist`; `.gitignore` excludes those folders.

## Storefront preview

The shop includes a product catalogue, search, category filters, saved products, product detail pages, size selection, persistent basket, UK delivery choices, and a checkout walkthrough. Checkout is a local prototype: it does not take payment, create a real order, or connect inventory/shipping services. A payment provider and fulfilment setup are needed before accepting real orders.

Every product has a Three.js 3D silhouette in its product viewer. Drag to rotate and scroll/pinch to zoom. Switch on **4D Motion** for a slow orbit and animated movement study. The 3D silhouettes are stylised browser-built models for this visual prototype; production listings should use dimension-accurate garment models and fabric scans.

## Assets

The supplied videos and ten collection photographs are local under `public/assets`. Each archive photograph is represented as a product; two black uniform pieces extend the range while keeping the original collection's monochrome styling.
