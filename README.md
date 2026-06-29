# Bali Trip Planner 🌴

An interactive, **shareable** itinerary dashboard for our Bali trip (**Jul 15–24, 2026**).
Drag activity cards onto a day, set durations, and plan morning-to-night — with **live
real-time sync** so all three of us edit the same plan at once.

## Features

- **Activity cards** grouped by **Uluwatu / Canggu / Ubud** (+ party/beach clubs), each with a
  duration, category icon, and **Instagram link**.
- **Interactive calendar** — day columns with a morning→night time grid. **Drag** a card onto a
  slot, **resize** to change duration, **drag** to reschedule.
- **Add to day dropdown** on every card — pick a day to schedule it (great on phones, no drag
  needed).
- **Auto event lineup** — party venues (Savaya, Single Fin, Finns, La Brisa, El Kabron, Atlas…)
  carry a weekly schedule. Drop one on a date and it auto-fills that day's event name + start/finish
  time.
- **Add your own places** — the "+ Add" form includes a **🔍 Search Instagram** button and a
  **# Use hashtag** auto-fill to grab an IG link fast.
- **Responsive** — optimized for desktop (full trip), iPad (paged days), and phone (single day +
  navigation).
- **Live sharing** via Firebase Firestore — one link, no logins for viewers.

> Without Firebase configured, the app runs in **local-only mode** (single browser, no sharing) —
> useful for trying it out.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
# add ?demo=1 to preview a pre-filled sample itinerary
```

## Enable live sharing (Firebase — ~5 min)

1. Create a free project at <https://console.firebase.google.com> → add a **Web app** → copy the
   config snippet.
2. Enable **Cloud Firestore** (production mode).
3. Copy `.env.example` → `.env.local` and paste your values (`VITE_FIREBASE_*`).
4. Publish the rules from `firestore.rules` (scopes access to the single `trips/bali-2026` path).

## Deploy (GitHub Pages → the shareable link)

1. Add the six `VITE_FIREBASE_*` values as **repository secrets** (Settings → Secrets → Actions),
   so the live site can reach Firestore.
2. Settings → **Pages** → Source: **GitHub Actions**.
3. Push — `.github/workflows/deploy.yml` builds and deploys.
4. Share: **https://naimbitar88.github.io/Bali-Plan/**

## Single-file preview

`npm run build:single` produces `dist-single/index.html` — one self-contained file you can open in
any browser or send to someone, no server needed (local-only mode).

## Tech

React + TypeScript + Vite · FullCalendar (drag/resize) · Firebase Firestore · GitHub Pages.
