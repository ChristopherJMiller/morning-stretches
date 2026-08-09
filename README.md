# morning-stretches

A guided morning mobility routine, built as an installable, offline-first PWA.

Pick a routine, hit start, and follow the countdown. The app talks you through
each stretch one at a time, keeps the screen awake while you move, and records a
daily streak so the habit sticks.

## Features

- **Three routines** — a five-minute *Wake Up*, a ten-minute *Full Morning
  Mobility*, and a floor-free *Standing Only* session for small spaces.
- **Guided timer** — per-move countdown ring, overall progress, and pause, skip
  and back controls. One-sided stretches are prompted for each side separately.
- **Streaks** — completions are stored locally, with a streak that survives
  until the end of the following day.
- **Optional chime** — a short tone between moves so you can keep your eyes
  closed.
- **Screen wake lock** — the display stays on while a routine is running, where
  the browser supports it.
- **Works offline** — the app is precached by a service worker and can be
  installed to a home screen.

Progress and preferences never leave the device; everything is kept in
`localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed URL. To try the installable, offline build:

```bash
npm run build
npm run preview
```

## Scripts

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start the dev server with hot reloading.       |
| `npm run build` | Type-check and build the production PWA.       |
| `npm run preview` | Serve the production build locally.          |
| `npm test`      | Run the unit and component tests once.         |
| `npm run lint`  | Lint the project with oxlint.                  |

## Project layout

```
src/
  routines.ts   Routine and stretch content
  session.ts    Pure state machine for a routine in progress
  storage.ts    Persistence, streak calculation
  audio.ts      Web Audio chime
  components/   Home, session and completion screens
  hooks/        Countdown driver and screen wake lock
  test/         Vitest unit and component tests
```

Adding or editing a routine only means editing `src/routines.ts`; the timer,
progress and preview screens all derive from that data.

## A note on safety

These are general mobility routines, not medical advice. Move within a
comfortable range, and skip anything that causes pain.
