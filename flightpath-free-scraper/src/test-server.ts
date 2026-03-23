/**
 * FREE Test Server - No Paid APIs Required
 * 
 * This server uses only:
 * - GitHub Actions scraped data
 * - Amadeus free tier (optional)
 * - Local caching
 * 
 * Cost: $0
 */

import http from 'http';
import { URL } from 'url';
import { searchFree, getFreeSourcesStatus, SearchParams } from './apis/free-orchestrator.js';
import { cache } from './cache/index.js';

const PORT = process.env.PORT || 3002;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  console.log(`[Server] ${req.method} ${url.pathname}`);

  try {
    // Health check
    if (url.pathname === '/api/health') {
      const sources = getFreeSourcesStatus();
      const cacheStats = cache.getStats();
      
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0-free',
        mode: '100% FREE - No paid APIs',
        sources,
        cache: cacheStats,
        env: {
          has_amadeus: !!(process.env.AMADEUS_KEY && process.env.AMADEUS_SECRET),
          node_env: process.env.NODE_ENV || 'development',
        },
        how_it_works: {
          primary: 'GitHub Actions scrapes flights every 6h (FREE)',
          secondary: 'Amadeus free tier (optional)',
          cache: 'Local cache for repeated queries',
          cost: '$0/month',
        },
      }, null, 2));
      return;
    }

    // Search flights
    if (url.pathname === '/api/search' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const params: SearchParams = JSON.parse(body);
          
          // Validation
          if (!params.origin || !params.destination || !params.departureDate) {
            res.writeHead(400);
            res.end(JSON.stringify({ 
              error: 'Missing required fields: origin, destination, departureDate' 
            }));
            return;
          }

          console.log(`[Search] ${params.origin} → ${params.destination} on ${params.departureDate}`);

          // Search using FREE methods
          const result = await searchFree(params);

          res.writeHead(200);
          res.end(JSON.stringify({
            ...result,
            timestamp: new Date().toISOString(),
            free_mode: true,
          }, null, 2));
        } catch (error) {
          console.error('[Search] Error:', error);
          res.writeHead(500);
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Search failed',
            timestamp: new Date().toISOString(),
          }));
        }
      });
      return;
    }

    // Source status
    if (url.pathname === '/api/sources') {
      res.writeHead(200);
      res.end(JSON.stringify({
        sources: getFreeSourcesStatus(),
        timestamp: new Date().toISOString(),
      }, null, 2));
      return;
    }

    // Get data directory info
    if (url.pathname === '/api/data-status') {
      const { existsSync, readdirSync } = await import('fs');
      let files: string[] = [];
      
      if (existsSync('./data')) {
        files = readdirSync('./data').filter(f => f.endsWith('.json'));
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        availableRoutes: files.map(f => {
          const [origin, dest, date] = f.replace('.json', '').split('-');
          return { origin, destination: dest, date, file: f };
        }),
        totalRoutes: files.length,
        timestamp: new Date().toISOString(),
      }, null, 2));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path: url.pathname }));

  } catch (error) {
    console.error('[Server] Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     FlightPath FREE Scraper - 100% Zero Cost                     ║
╠══════════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                       ║
║                                                                  ║
║  💰 COST: $0/month                                               ║
║                                                                  ║
║  How it works:                                                   ║
║  1. GitHub Actions scrapes flights every 6 hours (FREE)          ║
║  2. Results stored in repo/data/ directory                       ║
║  3. Amadeus free tier for real-time (optional)                   ║
║  4. Local caching to reduce requests                             ║
║                                                                  ║
║  Endpoints:                                                      ║
║    GET  /api/health         - Health check                       ║
║    GET  /api/sources        - List available sources             ║
║    POST /api/search         - Search flights                     ║
║    GET  /api/data-status    - List available scraped routes      ║
║                                                                  ║
║  Example search:                                                 ║
║    curl -X POST http://localhost:${PORT}/api/search \             ║
║      -H "Content-Type: application/json" \                       ║
║      -d '{"origin":"LHR","destination":"JFK",                 ║
║             "departureDate":"2025-06-15"}'                     ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  server.close(() => process.exit(0));
});
