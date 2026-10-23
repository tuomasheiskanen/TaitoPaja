# TaitoPaja

A small offline learning app (PWA) for kids. The first module teaches Finnish
letters, syllables and two-syllable words. Everything runs and is stored on the phone.

Design source: Claude Design project "TaitoPaja" (`TaitoPaja.dc.html`).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173, also reachable from the phone on the same Wi-Fi
```

## Build and host

```sh
npm run build      # outputs static files to dist/
```

Copy `dist/` to any static web server. It must be served over **HTTPS** for the
install prompt and offline mode to work. If the app lives under a sub-path, build with
`BASE_PATH=/taitopaja/ npm run build`.

Install on the phone: open the URL, then
- iPhone (Safari): Share → *Lisää Koti-valikkoon*
- Android (Chrome): menu → *Asenna sovellus*

After the first load the app works offline. New builds are picked up automatically
the next time the app is opened online.

Speech uses the phone's built-in Finnish voice. On iPhone, check that a Finnish voice
is available under Settings → Accessibility → Spoken Content → Voices.

## Structure

- `src/shared/` – speech, sound effects, visual effects, local storage, icons
- `src/modules/reading/` – the reading module (letters, syllables, words)

New skills (e.g. math) go in their own folder under `src/modules/`.

Icons are generated from `public/favicon.svg` with `npm run icons`.
