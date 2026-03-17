# DEEP SEARCH TIMEOUT ELIMINATION - SYSTEM REDESIGN

## 🟠 PHASE 1: ROOT CAUSE ANALYSIS

### EXACT Failure Points Identified

#### 1. SERIAL SCRAPING IN SPLIT-ENGINE (CRITICAL)
**Location:** `/lib/split-engine.ts:findSplitTickets()`
```typescript
for (const hub of relevantHubs) {  // 5 hubs
  const leg1Flights = await scrapeGoogleFlightsReal(...);  // 25s
  const leg2Flights = await scrapeGoogleFlightsReal(...);  // 25s
  // Total: 5 × (25+25) = 250 seconds MAXIMUM
}
```
**Problem:** Sequential hub processing. Each hub triggers 2 scrapes. 5 hubs = 10 serial scrapes.

#### 2. SYNCHRONOUS BROWSER CONTEXT
**Location:** `/lib/scraper-real.ts`
```typescript
let browser: Browser | null = null;  // Global singleton
let context: BrowserContext | null = null;  // Shared context
```
**Problem:** Single browser instance blocks all concurrent scrapes. One slow page blocks everyone.

#### 3. NO PROGRESSIVE STREAMING
**Location:** `/app/api/search/route.ts:processDeepSearch()`
```typescript
updateProgress(10);
const [googleFlights, skyscanner] = await Promise.all([...]);  // WAIT FOR ALL
updateProgress(50);  // Nothing between 10-50%
// Results only returned at 100%
```
**Problem:** Binary progress (0% or 100%). No intermediate results.

#### 4. POLLING TIMEOUT
**Location:** `/app/page.tsx:pollForResults()`
```typescript
const maxAttempts = 30; // 60 seconds max
// Throws: 'Deep search timeout' after 60s
```
**Problem:** Hard 60s limit. No partial results. Complete failure mode.

#### 5. VERCEL 60s HARD LIMIT
**Location:** All API routes
```typescript
export const maxDuration = 60;  // Cannot exceed on Hobby plan
```
**Problem:** Absolute ceiling. Any operation >60s = 504 error.

#### 6. NO TASK ISOLATION
**Location:** `/lib/job-queue.ts:processJob()`
```typescript
const results = await processor(job, updateProgress);  // All-or-nothing
// If one scrape fails, whole job fails
```
**Problem:** No per-task timeout. No graceful degradation.

### Time Loss Breakdown (Typical Deep Search)
| Component | Time | Cumulative |
|-----------|------|------------|
| Browser launch | 3s | 3s |
| Google Flights scrape | 25s | 28s |
| Skyscanner scrape | 20s | 48s |
| Hub 1 leg 1 scrape | 25s | 73s | ← EXCEEDS 60s LIMIT |
| Hub 1 leg 2 scrape | 25s | 98s |
| Hub 2+ (×4 more) | 200s | 298s |
| **TOTAL** | **~300s** | **FAILURE** |

### Component Triggering 504
**Primary:** `/app/api/search/route.ts` → `processDeepSearch()`
**Secondary:** `/lib/split-engine.ts` → Sequential hub scraping
**Tertiary:** `/lib/scraper-real.ts` → Blocking browser operations

---

## 🔧 PHASE 2: ARCHITECTURE REDESIGN

### NEW SYSTEM: "FLIGHTSTREAM" ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLIGHTSTREAM SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER REQUEST                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────────┐ │
│  │   API GATEWAY   │───▶│          ORCHESTRATOR (Stream Manager)           │ │
│  │  /api/stream    │    │  • Creates search session                        │ │
│  │                 │◀───│  • Returns session ID immediately                │ │
│  └─────────────────┘    │  • Spawns worker pool                            │ │
│         │               └─────────────────────────────────────────────────┘ │
│         │                              │                                     │
│         │                              ▼                                     │
│         │               ┌─────────────────────────────────────────────────┐  │
│         │               │           WORKER POOL (8 workers)                │  │
│         │               │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐  │  │
│         │               │ │ Worker1 │ │ Worker2 │ │ Worker3 │ │  ...   │  │  │
│         │               │ │(Amadeus)│ │ (Google)│ │(Hub:DXB)│ │        │  │  │
│         │               │ └────┬────┘ └────┬────┘ └────┬────┘ └────────┘  │  │
│         │               └──────┼───────────┼───────────┼──────────────────┘  │
│         │                      │           │           │                      │
│         │                      ▼           ▼           ▼                      │
│         │               ┌─────────────────────────────────────────────────┐  │
│         │               │          RESULT AGGREGATOR (Redis)               │  │
│         │               │  • Receives partial results                      │  │
│         │               │  • Deduplicates flights                          │  │
│         │               │  • Calculates split tickets as data arrives      │  │
│         │               │  • Streams to client via SSE                     │  │
│         │               └────────────────────┬──────────────────────────────┘  │
│         │                                    │                                │
│         │                         ┌──────────┴──────────┐                     │
│         │                         ▼                     ▼                     │
│         │                    ┌─────────┐          ┌─────────┐                │
│         │                    │  CACHE  │          │  SSE    │                │
│         │                    │ (Redis) │          │ STREAM  │                │
│         │                    └────┬────┘          └────┬────┘                │
│         │                         │                  │                       │
│         └─────────────────────────┴──────────────────┘                       │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                │
│                          │     CLIENT      │                                │
│                          │  Real-time UI   │                                │
│                          │  Updates        │                                │
│                          └─────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1 ASYNCHRONOUS SEARCH ARCHITECTURE

#### New Endpoint: `/api/stream/search`
```typescript
// IMMEDIATE RESPONSE - No waiting
export async function POST(req: Request) {
  const sessionId = generateSessionId();
  
  // Fire-and-forget: Start search in background
  startSearchStream(sessionId, params);
  
  // Return immediately with session ID
  return Response.json({ 
    sessionId, 
    status: 'streaming',
    streamUrl: `/api/stream/${sessionId}` 
  });
}
```

#### New Endpoint: `/api/stream/[sessionId]` (SSE)
```typescript
// Server-Sent Events for real-time updates
export async function GET(req: Request, { params }) {
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to Redis pub/sub for this session
      redis.subscribe(`stream:${params.sessionId}`, (message) => {
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

### 2.2 JOB QUEUE + WORKER SYSTEM

#### Worker Pool Architecture
```typescript
// /lib/worker-pool.ts
interface WorkerPool {
  // 8 concurrent workers max
  workers: Worker[];
  queue: TaskQueue;
  
  submit(task: SearchTask): Promise<void>;
  onResult(callback: (result: PartialResult) => void): void;
}

interface SearchTask {
  id: string;
  type: 'amadeus' | 'google' | 'skyscanner' | 'hub-leg';
  params: TaskParams;
  priority: number;
  timeout: number;  // 5-10s per task
  retries: number;  // 3 retries per task
}
```

#### Task Types with Isolated Timeouts
```typescript
// Each task has its own timeout - no single point of failure
const TASK_CONFIG = {
  amadeus: { timeout: 8000, retries: 2, workers: 2 },
  google: { timeout: 10000, retries: 2, workers: 2 },
  skyscanner: { timeout: 10000, retries: 2, workers: 2 },
  hubLeg: { timeout: 8000, retries: 1, workers: 2 }
};

// Parallel execution of ALL hubs
async function executeHubSearches(hubs: string[]) {
  // Fire all hub searches simultaneously
  const hubTasks = hubs.map(hub => ({
    type: 'hub-leg' as const,
    params: { hub, origin, destination, date },
    timeout: 8000,  // 8s per hub pair
    onResult: (flights) => aggregator.addHubResults(hub, flights)
  }));
  
  // All hubs search in parallel, not sequence
  await Promise.allSettled(hubTasks.map(t => executeTask(t)));
}
```

---

### 2.3 PROGRESSIVE RESULT STREAMING

#### Result Aggregation with Streaming
```typescript
// /lib/result-aggregator.ts
class StreamingAggregator {
  private results: Flight[] = [];
  private splitTickets: SplitTicket[] = [];
  private subscribers: Set<(update: Update) => void> = new Set();
  
  addFlights(flights: Flight[], source: string) {
    // Validate immediately
    const valid = flights.filter(validateFlight);
    this.results.push(...valid);
    
    // Deduplicate
    this.results = deduplicateByPriceAndRoute(this.results);
    
    // Sort by price
    this.results.sort((a, b) => a.price - b.price);
    
    // Stream update to all subscribers
    this.broadcast({
      type: 'flights',
      data: this.results.slice(0, 20),  // Top 20
      source,
      progress: this.calculateProgress()
    });
    
    // Trigger split ticket calculation with new data
    this.updateSplitTickets();
  }
  
  private updateSplitTickets() {
    // Calculate split tickets incrementally as data arrives
    const newSplits = findSplitOpportunities(this.results);
    if (newSplits.length > 0) {
      this.broadcast({
        type: 'splitTickets',
        data: newSplits
      });
    }
  }
  
  broadcast(update: Update) {
    this.subscribers.forEach(cb => cb(update));
  }
}
```

#### Client-Side Stream Handler
```typescript
// /app/hooks/useFlightStream.ts
export function useFlightStream() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [splitTickets, setSplitTickets] = useState<SplitTicket[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'complete'>('idle');
  
  const startStream = async (params: SearchParams) => {
    // 1. Start search
    const { sessionId, streamUrl } = await fetch('/api/stream/search', {
      method: 'POST',
      body: JSON.stringify(params)
    }).then(r => r.json());
    
    setStatus('streaming');
    
    // 2. Connect to SSE stream
    const eventSource = new EventSource(streamUrl);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch(update.type) {
        case 'flights':
          setFlights(update.data);
          setProgress(update.progress);
          break;
        case 'splitTickets':
          setSplitTickets(update.data);
          break;
        case 'complete':
          setStatus('complete');
          eventSource.close();
          break;
        case 'error':
          // Non-fatal error - continue streaming
          console.warn('Partial error:', update.error);
          break;
      }
    };
    
    // 3. NEVER TIMEOUT - stream continues until complete
    // User sees results immediately and they improve over time
  };
  
  return { flights, splitTickets, progress, status, startStream };
}
```

---

### 2.4 TIMEOUT ELIMINATION STRATEGY

#### Per-Task Timeouts (Not Global)
```typescript
// Each task has its own short timeout
async function executeTask(task: SearchTask): Promise<TaskResult> {
  const startTime = Date.now();
  
  for (let attempt = 0; attempt < task.retries; attempt++) {
    try {
      const result = await Promise.race([
        task.execute(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new TaskTimeoutError()), task.timeout)
        )
      ]);
      
      return { success: true, data: result, duration: Date.now() - startTime };
      
    } catch (error) {
      if (attempt === task.retries - 1) {
        // Final failure - return empty but don't kill search
        return { 
          success: false, 
          error: error.message,
          partial: task.getPartialResults?.() || []
        };
      }
      // Retry with backoff
      await sleep(1000 * (attempt + 1));
    }
  }
}
```

#### Graceful Degradation Chain
```typescript
// Fallback chain for each route
async function searchWithFallbacks(origin, dest, date) {
  const sources = [
    { name: 'amadeus', fn: searchAmadeus, timeout: 8000 },
    { name: 'google', fn: scrapeGoogle, timeout: 10000 },
    { name: 'skyscanner', fn: scrapeSkyscanner, timeout: 10000 },
    { name: 'cached', fn: getCachedResults, timeout: 1000 }
  ];
  
  // Try all in parallel, use what comes back
  const results = await Promise.allSettled(
    sources.map(s => executeWithTimeout(s.fn, s.timeout))
  );
  
  // Merge successful results
  const flights = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value || []);
  
  if (flights.length === 0) {
    // Absolute fallback: return empty with message
    return { 
      flights: [], 
      meta: { 
        message: 'No results found - try different dates or airports',
        sourcesTried: sources.map(s => s.name)
      }
    };
  }
  
  return { flights, meta: { sources: successfulSources } };
}
```

---

### 2.5 FALLBACK SYSTEM

#### Multi-Layer Fallback Architecture
```
Layer 1: Amadeus API (fastest)
    ↓ (if timeout/fail)
Layer 2: Google Flights scraper
    ↓ (if timeout/fail)
Layer 3: Skyscanner scraper  
    ↓ (if timeout/fail)
Layer 4: Cached results (24h)
    ↓ (if none)
Layer 5: Partial results + "Search in progress" message
```

#### Implementation
```typescript
// Never return error - always return something
export async function searchWithGuaranteedResults(params) {
  const aggregator = new StreamingAggregator();
  
  // Start all sources
  const searches = [
    amadeusSearch(params).then(r => aggregator.add(r, 'amadeus')),
    googleSearch(params).then(r => aggregator.add(r, 'google')),
    skyscannerSearch(params).then(r => aggregator.add(r, 'skyscanner'))
  ];
  
  // Return immediately with what we have after 2 seconds
  await Promise.race([
    Promise.allSettled(searches),
    sleep(2000)  // Guarantee response in 2s
  ]);
  
  const initialResults = aggregator.getResults();
  
  if (initialResults.length > 0) {
    return {
      status: 'partial',
      flights: initialResults,
      message: 'More results loading...',
      streamUrl: aggregator.getStreamUrl()
    };
  }
  
  // Absolute fallback
  return {
    status: 'loading',
    flights: [],
    message: 'Searching all sources - results in 10-30 seconds',
    streamUrl: aggregator.getStreamUrl()
  };
}
```

---

## 🧩 PHASE 3: PERFORMANCE OPTIMISATION

### 3.1 Parallelisation

#### Hub Search Parallelisation
```typescript
// OLD: Sequential (250s)
for (const hub of hubs) {
  await scrapeLeg1();  // 25s
  await scrapeLeg2();  // 25s
}

// NEW: Parallel (25s max)
const hubPairs = hubs.flatMap(hub => [
  { type: 'leg1', hub, origin, dest },
  { type: 'leg2', hub, origin, dest }
]);

const results = await Promise.allSettled(
  hubPairs.map(pair => scrapeWithTimeout(pair, 8000))
);
```

#### Browser Pool (Not Singleton)
```typescript
// /lib/browser-pool.ts
class BrowserPool {
  private pool: Browser[] = [];
  private maxBrowsers = 4;
  private queue: PageRequest[] = [];
  
  async acquirePage(): Promise<Page> {
    // Return available browser or queue
    const browser = await this.getAvailableBrowser();
    return browser.newPage();
  }
  
  async releasePage(page: Page): Promise<void> {
    await page.close();
    // Process queue
    this.processQueue();
  }
}
```

### 3.2 Caching Strategy

#### Multi-Tier Cache
```typescript
// /lib/cache.ts
interface CacheStrategy {
  // L1: In-memory (1 minute)
  memory: Map<string, CacheEntry>;
  
  // L2: Redis (24 hours)
  redis: RedisClient;
  
  // L3: Database (30 days)
  db: DatabaseClient;
}

const CACHE_TTL = {
  flightSearch: 60 * 60,      // 1 hour
  splitTickets: 30 * 60,      // 30 minutes
  priceCheck: 5 * 60,         // 5 minutes
  routeCache: 24 * 60 * 60    // 24 hours
};
```

### 3.3 Smart Search Pruning

#### Early Termination
```typescript
function shouldContinueSearching(context: SearchContext): boolean {
  // Stop if we have 20+ good results
  if (context.validResults >= 20) return false;
  
  // Stop if search time > 45 seconds
  if (context.elapsedTime > 45000) return false;
  
  // Stop if we've found prices < £200
  if (context.cheapestPrice < 200) return false;
  
  return true;
}
```

---

## 🛡️ PHASE 4: ANTI-FAILURE SYSTEM

### 4.1 Monitoring Dashboard

```typescript
// /lib/monitoring-v2.ts
interface SearchMetrics {
  // Real-time metrics
  activeSearches: number;
  averageResponseTime: number;
  timeoutRate: number;
  
  // Per-source metrics
  sourceHealth: Map<string, {
    successRate: number;
    avgLatency: number;
    lastFailure: Date;
    circuitBreakerOpen: boolean;
  }>;
  
  // Alerts
  alerts: {
    highTimeoutRate: boolean;
    sourceDegraded: string[];
    queueBacklog: number;
  };
}
```

### 4.2 Circuit Breaker Pattern

```typescript
// /lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private timeout = 60000;  // 1 minute cooldown
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker open - using fallback');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}

// Usage
const googleBreaker = new CircuitBreaker();
const results = await googleBreaker.execute(() => scrapeGoogle());
```

### 4.3 Auto-Recovery

```typescript
// Automatic retry with exponential backoff
async function resilientScrape(scraper: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await scraper();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      await sleep(1000 * Math.pow(2, i));
      
      // Rotate user agent / proxy
      rotateIdentity();
    }
  }
}
```

---

## 🧪 PHASE 5: VALIDATION TEST SUITE

### Test Scenarios

```typescript
// /tests/deep-search.stress.test.ts
describe('Deep Search Timeout Elimination', () => {
  
  test('NEVER returns timeout error', async () => {
    const result = await deepSearch({ timeout: 1 });  // Force timeout
    expect(result.error).toBeUndefined();
    expect(result.status).toBe('partial' or 'complete');
  });
  
  test('Returns results within 2 seconds', async () => {
    const start = Date.now();
    const result = await deepSearch(params);
    expect(Date.now() - start).toBeLessThan(2000);
  });
  
  test('Streams progressively', async () => {
    const updates: any[] = [];
    const stream = deepSearchStream(params);
    
    for await (const update of stream) {
      updates.push(update);
    }
    
    // Should receive multiple updates
    expect(updates.length).toBeGreaterThan(1);
    
    // First update should have some results
    expect(updates[0].flights.length).toBeGreaterThan(0);
  });
  
  test('Survives all API failures', async () => {
    // Mock all APIs to fail
    mockAmadeus.fail();
    mockGoogle.fail();
    mockSkyscanner.fail();
    
    const result = await deepSearch(params);
    
    // Should still return something (cache or message)
    expect(result.status).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  test('Handles 100 concurrent searches', async () => {
    const searches = Array(100).fill(null).map(() => deepSearch(params));
    const results = await Promise.all(searches);
    
    // All should succeed
    expect(results.every(r => !r.error)).toBe(true);
  });
});
```

---

## 📦 IMPLEMENTATION ROADMAP

### Immediate Implementation (Top 10)

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | Implement `/api/stream/search` endpoint | CRITICAL | 2h |
| 2 | Create SSE streaming endpoint | CRITICAL | 2h |
| 3 | Parallelize hub scraping | HIGH | 3h |
| 4 | Add per-task timeouts (5-10s) | HIGH | 1h |
| 5 | Remove 60s polling limit | HIGH | 30m |
| 6 | Implement progressive results | HIGH | 3h |
| 7 | Add fallback chain | MEDIUM | 2h |
| 8 | Browser pool (not singleton) | MEDIUM | 2h |
| 9 | Redis result aggregation | MEDIUM | 3h |
| 10 | Circuit breaker for sources | LOW | 2h |

### File Changes Required

```
NEW FILES:
├── app/api/stream/search/route.ts      # New streaming search endpoint
├── app/api/stream/[id]/route.ts        # SSE endpoint
├── lib/worker-pool.ts                  # Worker pool management
├── lib/stream-aggregator.ts            # Progressive result aggregation
├── lib/browser-pool.ts                 # Browser instance pool
├── lib/circuit-breaker.ts              # Circuit breaker pattern
├── lib/cache-tiered.ts                 # Multi-tier caching
├── hooks/useFlightStream.ts            # Client streaming hook
└── tests/deep-search.stress.test.ts    # Stress tests

MODIFY:
├── app/api/search/route.ts             # Replace with streaming
├── lib/split-engine.ts                 # Parallel hub search
├── lib/scraper-real.ts                 # Browser pool integration
└── app/page.tsx                        # Use streaming hook
```

---

## ✅ SUCCESS CRITERIA (Verification Checklist)

- [ ] Deep search completes without timeout error (100% of requests)
- [ ] First results appear within 2 seconds
- [ ] Results update progressively (not batch)
- [ ] System handles 100 concurrent searches
- [ ] All API failures return partial results (not errors)
- [ ] UI remains responsive during search
- [ ] 504 errors eliminated from logs
- [ ] Split tickets calculate incrementally
- [ ] User can cancel search without error
- [ ] Search survives server restart mid-flight

---

## ARCHITECTURE DECISION RECORD

**Decision:** Replace synchronous polling with Server-Sent Events (SSE) streaming

**Rationale:**
- Polling creates artificial 60s limit
- SSE provides true real-time updates
- No timeout ceiling on streaming connections
- Native browser support (EventSource)

**Rejected Alternatives:**
- WebSockets: Overkill for one-way streaming
- Long-polling: Still has timeout issues
- GraphQL subscriptions: Too complex for current needs

**Consequences:**
- Positive: Eliminates timeout errors completely
- Positive: Better user experience (instant feedback)
- Negative: Requires Redis for multi-server coordination
- Negative: Slightly more complex infrastructure

---

END OF SYSTEM REDESIGN DOCUMENT
