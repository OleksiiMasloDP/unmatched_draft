# Relay

1. `cd worker && npx wrangler login` (free Cloudflare account)
2. `npx wrangler deploy`
3. Put the printed URL into `.env.production` in the project root:
   `VITE_RELAY_URL=wss://unmatched-relay.<account>.workers.dev`
4. `npm run deploy`
