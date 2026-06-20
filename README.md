# LifeOS

An AI-powered goal execution platform. Tell it what you want to achieve —
it builds the roadmap, tracks your progress, and remembers everything,
across every session.

Built for the AWS Build On Hackathon (Track 4: Open Innovation).

## Stack

- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** Node.js + Express
- **Database:** Amazon DynamoDB (single-table design)
- **AI:** Anthropic Claude API with tool use
- **Integrations:** MCP (Model Context Protocol) — Google Calendar, Gmail, GitHub, Notion

## Project structure

```
lifeos/
├── client/     React + Vite frontend (see client/docs/CLIENT_GUIDE.md)
└── server/     Express API + DynamoDB + AI logic (see server/docs/API_GUIDE.md)
```

## Quick start

1. Install everything:
   ```
   npm run install:all
   ```

2. Set up your environment variables — copy the example files and fill
   them in:
   ```
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Create the DynamoDB table (only needs to be run once):
   ```
   npm run setup:db
   ```

4. Run the server and client in two separate terminals:
   ```
   npm run dev:server
   npm run dev:client
   ```

5. Open the app at `http://localhost:5173`. The API runs at
   `http://localhost:4000` and its interactive docs are at
   `http://localhost:4000/api-docs`.

## Where to go next

- New to this codebase? Start with `client/docs/CLIENT_GUIDE.md`.
- Working on the API? Start with `server/docs/API_GUIDE.md`.
- Full product spec: see the project requirements document.
