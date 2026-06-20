# LifeOS — API Guide

A simple guide to how the backend is organized, and how to use the
interactive API docs.

## The big picture

The server is an Express app. It receives requests from the frontend,
talks to DynamoDB to save and load data, and talks to Claude (the AI)
when it needs to think or respond to a chat message.

```
Frontend  →  Express server (this folder)  →  DynamoDB
                                            →  Claude API
```

## Try the API without writing code

Run the server, then open this in your browser:

```
http://localhost:4000/api-docs
```

This is a Swagger page — it lists every endpoint, what it expects, and
what it returns. You can click "Try it out" on any endpoint, fill in
some values, and send a real request right from the browser. This is
the fastest way to check if something works without needing to build
a UI for it first.

## Where things live

### `src/routes/`

Each file lists the URLs (endpoints) the app responds to, like
`/goals` or `/chat`. The comments above each route (starting with
`@swagger`) are what generates the docs page — if you add a new
route, add a comment block like the others so it shows up there too.

Routes don't contain real logic — they just point to a controller.

### `src/controllers/`

This is where the actual logic lives. When a request hits
`POST /goals`, it's `goals.controller.js` that decides what to do:
check the input, save it to the database, send back a response.

If routes are "which door to knock on," controllers are "what happens
once you're inside."

### `src/ai/`

Everything related to talking to Claude lives here.

- `tools.js` — the list of actions Claude is allowed to take (like
  "create a goal" or "mark a milestone done")
- `contextAssembler.js` — builds the information Claude needs before
  replying, like the user's current goals

### `src/middleware/`

Code that runs before a request reaches a controller.

- `auth.js` — checks the person is logged in (has a valid token)
- `errorHandler.js` — catches errors so the server doesn't crash, and
  sends back a clean error message instead

### `src/config/`

Setup files. `dynamodb.js` connects to the database. `env.js` reads
environment variables. `swagger.js` builds the docs page.

### `scripts/createTable.js`

Run this once to create the database table:

```
node scripts/createTable.js
```

You don't need to run it again unless you delete the table.

## How a typical request works

Say the frontend asks to create a new goal:

1. The request hits `POST /api/goals`.
2. `auth.js` middleware checks the person is logged in.
3. `goals.routes.js` passes the request to `goals.controller.js`.
4. The controller checks the input is valid, then saves it to
   DynamoDB.
5. The controller sends back the saved goal as the response.

For the AI chat, it's a bit more involved:

1. The request hits `POST /api/chat` with a message.
2. The server fetches the person's current goals and recent messages
   from DynamoDB (`contextAssembler.js`).
3. That information, plus the new message, is sent to Claude.
4. If Claude decides to take an action (like creating a goal), the
   server actually performs that action in the database.
5. Claude's reply is sent back to the frontend, along with a list of
   what actions were taken.

## Adding a new endpoint — step by step

Say you want to add a way to fetch a single opportunity by ID.

1. Open `src/routes/opportunities.routes.js`.
2. Add a new route, with a `@swagger` comment above it describing what
   it does (copy the style of the ones already there).
3. Open `src/controllers/opportunities.controller.js` and write a new
   function that handles the logic.
4. Connect the route to the controller function.
5. Restart the server and check `/api-docs` — your new endpoint should
   show up automatically.

## A few simple rules

- **Routes don't contain logic.** If you're writing an `if` statement
  or a database call inside a route file, it belongs in a controller
  instead.
- **Always check who's asking.** Any endpoint that reads or changes a
  person's data should use the `requireAuth` middleware.
- **Document as you go.** Add the `@swagger` comment when you add a
  route, not after — it's much easier to write while the endpoint is
  fresh in your mind.
- **One table, clear keys.** All data lives in one DynamoDB table.
  Every item has a `PK` (which user it belongs to) and an `SK` (what
  kind of item it is). Stick to the existing patterns when adding new
  data types.

## Questions to ask yourself when stuck

- "What does this endpoint expect and return?" → check `/api-docs`
- "Where's the actual logic for this?" → check `controllers/`
- "Is this request allowed to happen?" → check `middleware/auth.js`
- "How is this saved in the database?" → check the `PK`/`SK` pattern
  in the relevant controller

That's the whole server. Every request follows the same shape: check
who's asking, do the work, save or load from the database, send back
a clean response.
