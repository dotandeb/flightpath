# FlightPath

Smart split-ticket flight search. Find cheaper flights by booking separate one-way tickets.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

## Environment Variables

None required for MVP (simulated data).

For production with Amadeus API:
- `AMADEUS_API_KEY`
- `AMADEUS_API_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
