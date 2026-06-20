# LifeOS — Client Guide

This is a simple guide to how the frontend code is organized. No
jargon, no complicated grammar — just what each folder does and where
to put new code.

## The big picture

The app is a normal React app. A person opens it in their browser,
clicks around, and the app talks to our server to get and save data.
That's it.

```
Browser  →  React app (this folder)  →  Server  →  Database
```

## Where things live

### `src/pages/`

Each file here is one full screen — like a whole page someone sees.
For example, `DashboardPage.jsx` is the goal dashboard. `ChatPage.jsx`
is the chat screen.

If you're building a new screen, it goes here.

### `src/components/`

Smaller pieces that get reused across pages. Things like a single goal
card, a button, a chat bubble. Split into folders by what they belong
to:

- `layout/` — sidebar, top bar, page wrappers
- `chat/` — chat bubbles, the message input box
- `dashboard/` — goal cards, metric boxes
- `goals/` — milestone rows, progress bars
- `opportunities/` — opportunity cards
- `integrations/` — the connect/disconnect app cards
- `shared/` — generic stuff used everywhere, like buttons and badges

If a piece of UI shows up on more than one page, it probably belongs
here instead of inside a page file.

### `src/services/api.js`

This is the only file that talks to the server. Every single backend
call goes through here. If you need to fetch goals, you call
`getGoals()` from this file — you never write `fetch()` directly
inside a page or component.

Why this matters: if the server address changes, or how we send the
login token changes, we only fix it in one place.

### `src/context/AuthContext.jsx`

Keeps track of who's logged in. Any page can ask "is someone logged
in right now?" using:

```jsx
const { user, login, logout } = useAuth();
```

### `src/hooks/`

Small reusable pieces of logic that aren't tied to one specific
screen. For example, a hook that polls for new chat messages, or one
that handles form input. If you find yourself copying the same
`useState` and `useEffect` logic into two different pages, that logic
probably belongs here instead.

### `src/utils/`

Plain helper functions that don't touch React at all. Things like
formatting a date, or turning "2026-03-01" into "March 2026". No
components here, just functions.

### `src/styles/`

Global CSS that applies to the whole app — colors, fonts, spacing
rules. Anything specific to one component should live next to that
component instead.

## How a typical screen works

Here's the normal pattern for any page in this app:

1. The page loads and calls a function from `services/api.js` to get
   data (for example, `getGoals()`).
2. While waiting, it shows a loading state.
3. Once the data arrives, it's stored using `useState` and shown on
   the screen.
4. If the person clicks something (like marking a milestone done),
   the page calls another function from `services/api.js` to save
   that change.
5. The screen updates to reflect the new data.

That's the loop for almost every page: load data → show it → let the
person change it → save the change.

## Adding a new page — step by step

Say you want to add a new "Profile" page.

1. Create `src/pages/ProfilePage.jsx`.
2. Build the screen using existing components from `src/components/`
   where you can, instead of writing everything from scratch.
3. If you need data from the server, add a new function in
   `src/services/api.js` (or use one that already exists).
4. Open `src/App.jsx` and add a new route so the page is reachable by
   URL.
5. If the page should only be visible to logged-in users, wrap it in
   `<ProtectedRoute>` like the other pages.

## A few simple rules

- **One file, one job.** A page file shows a screen. A component file
  shows one small piece. A service file talks to the server. Don't mix
  these up.
- **Don't call `fetch()` directly in a page.** Always go through
  `services/api.js`.
- **Reuse before you rebuild.** Check `src/components/shared/` before
  writing a new button or badge — it probably already exists.
- **Keep components small.** If a component file gets long and hard
  to read, it's a sign it should be split into smaller pieces.

## Environment variables

The app needs to know where the server is. This lives in a `.env`
file (copy `.env.example` to get started):

```
VITE_API_URL=http://localhost:4000/api
```

If you change this, restart the dev server for it to take effect.

## Questions to ask yourself when stuck

- "Where does this data come from?" → check `services/api.js`
- "Is this UI used somewhere else too?" → check `components/`
- "Is the user logged in here?" → check `AuthContext.jsx`
- "Where does this URL go?" → check `App.jsx`

That's the whole app. Nothing here is more complicated than: show a
screen, get some data, let the person interact, save the change.
