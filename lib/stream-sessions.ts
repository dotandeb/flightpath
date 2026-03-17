/**
 * STREAM SESSION MANAGER
 * Shared state for streaming search sessions
 */

export interface StreamSession {
  id: string;
  status: 'streaming' | 'complete' | 'error';
  results: {
    flights: any[];
    splitTickets: any[];
    sources: string[];
  };
  subscribers: Set<(update: StreamUpdate) => void>;
  startedAt: number;
  lastUpdate: number;
}

export interface StreamUpdate {
  type: 'flights' | 'splitTickets' | 'progress' | 'complete' | 'error' | 'connected';
  data?: any;
  progress?: number;
  source?: string;
  message?: string;
  timestamp: number;
}

// In-memory store for streaming sessions (use Redis in production)
const streamSessions = new Map<string, StreamSession>();

export function createSession(id: string): StreamSession {
  const session: StreamSession = {
    id,
    status: 'streaming',
    results: { flights: [], splitTickets: [], sources: [] },
    subscribers: new Set(),
    startedAt: Date.now(),
    lastUpdate: Date.now()
  };
  streamSessions.set(id, session);
  return session;
}

export function getSession(id: string): StreamSession | undefined {
  return streamSessions.get(id);
}

export function deleteSession(id: string): boolean {
  return streamSessions.delete(id);
}

export function subscribeToSession(sessionId: string, callback: (update: StreamUpdate) => void): boolean {
  const session = streamSessions.get(sessionId);
  if (!session) return false;
  
  session.subscribers.add(callback);
  
  // Send current state immediately
  if (session.results.flights.length > 0) {
    callback({
      type: 'flights',
      data: session.results.flights,
      progress: session.status === 'complete' ? 100 : 50,
      timestamp: Date.now()
    });
  }
  
  return true;
}

export function unsubscribeFromSession(sessionId: string, callback: (update: StreamUpdate) => void): void {
  const session = streamSessions.get(sessionId);
  if (session) {
    session.subscribers.delete(callback);
  }
}

export function broadcast(sessionId: string, update: StreamUpdate): void {
  const session = streamSessions.get(sessionId);
  if (!session) return;
  
  session.lastUpdate = Date.now();
  session.subscribers.forEach(callback => {
    try {
      callback(update);
    } catch (e) {
      session.subscribers.delete(callback);
    }
  });
}

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [id, session] of streamSessions) {
    if (session.lastUpdate < fiveMinutesAgo) {
      streamSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);
