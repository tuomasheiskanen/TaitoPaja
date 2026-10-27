# TaitoPaja

A small offline learning app (PWA) for kids. The first module teaches Finnish
letters, syllables and two-syllable words. Everything runs and is stored on the phone.

Design source: Claude Design project "TaitoPaja", file `TaitoPaja.dc.html`
(https://claude.ai/design/p/b4f9a9d7-07f9-40f5-8c7d-8e89f1dd2f09?file=TaitoPaja.dc.html).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173, also reachable from the phone on the same Wi-Fi
```

## Deploy

Live at **https://taitopaja.sluiba.com** (also https://taitopaja.vercel.app).

- Hosted on Vercel, project `taitopaja` in the `sluiba` team (Hobby plan).
- The GitHub repo `tuomasheiskanen/TaitoPaja` (public) is connected to Vercel:
  every push to `main` deploys to production; other branches get preview URLs.
- Manual deploy if needed: `npx vercel deploy --prod`.
- DNS: `taitopaja.sluiba.com` is a CNAME to `f874710ae2e8f514.vercel-dns-017.com.`
  in the OVHcloud DNS zone of `sluiba.com`. Vercel issues the HTTPS certificate.

To build locally: `npm run build` (outputs static files to `dist/`). If the app is ever
served under a sub-path, build with `BASE_PATH=/taitopaja/ npm run build`.

Install on the phone: open the URL, then
- iPhone (Safari): Share → *Lisää Koti-valikkoon*
- Android (Chrome): menu → *Asenna sovellus*

After the first load the app works offline. New builds are picked up automatically
the next time the app is opened online. Settings and progress live in the phone's
`localStorage` and are tied to the address the app was installed from.

Speech uses the phone's built-in Finnish voice. On iPhone, check that a Finnish voice
is available under Settings → Accessibility → Spoken Content → Voices.

## Structure

- `src/shared/` – speech, sound effects, visual effects, local storage, icons
- `src/modules/reading/` – the reading module (letters, syllables, words)

New skills (e.g. math) go in their own folder under `src/modules/`.

Ideas not yet built are in `docs/` (e.g. `docs/idea-recorded-sounds.md`).

Icons are generated from `public/favicon.svg` with `npm run icons`.
