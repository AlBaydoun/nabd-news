# NABD — Hostinger / GitHub edition

This is the standard Next.js / Node.js version of NABD, prepared for Hostinger Deploy Web App. It includes the Arabic, English, Russian and German editions, full article extraction where available, the language-learning section and browser-local saved cards.

## What to put in GitHub

Extract `nabd-hostinger-github.zip` into an empty folder. Upload **all extracted contents** to the root of a new GitHub repository. `package.json`, `package-lock.json` and `app/` must be at the repository root, not inside an extra `nabd-hostinger/` folder. Do not upload the ZIP itself as the repository contents.

The ZIP contains only source/configuration files. Do not add `node_modules`, `.next`, `.env`, generated deployment archives, the original Sites `.git` directory, or your browser data. A private GitHub repository is suitable; authorize Hostinger to access that repository when connecting it.

## Hostinger settings

Choose **Deploy Web App → Import Git Repository**, select this repository and its `main` branch, and keep Hostinger's temporary website address.

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | Repository root (`.`) |
| Node.js | 22.x (24.x is also allowed by package.json) |
| Package manager | npm |
| Install command, if requested | `npm ci` |
| Build command | `npm run build` |
| Output directory, if requested | `.next` |
| Start command, if requested | `npm start` |
| Environment variables | None required for current features |

Keep Next.js auto-detected backend settings. This is a server app; do not select static export. The start script listens on all interfaces and honors the platform-provided `PORT`.

Once deployment succeeds, open the temporary address and check `/`, `/en`, `/ru`, `/de`, a news article, and a learning translation.

## Local development

```sh
npm ci
npm run dev
```

Production check:

```sh
npm run build
npm start
```

## Features and limits

- Refresh asks configured publishers for their current feeds; publishers decide when new stories are available.
- Full text depends on publishers allowing article extraction. Restricted/unavailable pages remain labeled.
- The Language Studio keeps the same story collection across Arabic, English, Russian and German, with a four-language comparison view. Reference stories have prepared translations; new stories load translations when selected. Learning translates headlines and short summaries, not complete articles. MyMemory translations have service limits and may contain errors.
- Topics have individual colors and wave dividers. Religion & evidence includes current feeds and reference readings about arguments for and against belief, historical evidence and religious research; these do not assign a truth score to a religion.
- Saved story cards, translations and preferences use browser storage. They do not transfer automatically from the previous ChatGPT Site address to a Hostinger address, or between devices. Clearing browser storage removes them. Complete article pages are fetched when opened, not permanently archived.
- This standalone version does not use ChatGPT sign-in or Sites access controls. It has no account system.

## Image attribution

Cosmic Cliffs: NASA, ESA, CSA, STScI (2022), ESA/Webb CC BY 4.0, cropped. https://esawebb.org/images/weic2205a/

Beirut skyline: Evilscaught (2012), CC BY 3.0, cropped. https://commons.wikimedia.org/wiki/File:Beirut_Skyline_-_panoramio.jpg

Feed thumbnails belong to their publishers. UI vendor licenses are retained in `vendor/`.

Hostinger guide: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

## Verification

Updated on 27 September 2026. Validate with `npm run build` and `node --experimental-strip-types --test tests/*.test.mjs`. The app is deployed from this repository to Hostinger.

## Mobile reader and media

The mobile reader fills the screen, supports RTL, keeps text readable at 320px, and provides 44px controls. Card images and body areas open the same on-site reader; saved/read controls remain independent. Extracted article references keep safe, clickable links.

RSS image handling accepts extensionless CDN thumbnails, nested media groups, lazy images and relative URLs. Missing/broken card images try publisher article metadata only near the viewport, then use a labeled topic fallback. Images keep reserved dimensions. No unrestricted image proxy is exposed.

The reader detects YouTube, Vimeo, Dailymotion, and direct MP4/WebM/Ogg video from publisher markup and VideoObject metadata. Players load after a user tap and stay in the reader, with an explicit source fallback for unsupported or restricted playback. Publisher scripts and arbitrary iframes are not copied. Paywall restrictions remain enforced.

Validation: production build, TypeScript and 21 automated tests; browser checks at 320px and 390px for editions, language learning, search, save/reload, settings, article images and inline player insertion. Individual publishers can still block extraction, hotlinking or embedding.
