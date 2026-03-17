/**
 * MONITORING & ANTI-REGRESSION LAYER
 * Tracks failures, logs issues, prevents regressions
 */

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'critical';
  component: string;
  message: string;
  details?: any;
}

export interface Metrics {
  apiCalls: number;
  apiFailures: number;
  scraperCalls: number;
  scraperFailures: number;
  timeout504s: number;
  emptyResults: number;
  fakeDataDetected: number;
  avgResponseTime: number;
}

// In-memory logs (use external logging in production)
const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

let metrics: Metrics = {
  apiCalls: 0,
  apiFailures: 0,
  scraperCalls: 0,
  scraperFailures: 0,
  timeout504s: 0,
  emptyResults: 0,
  fakeDataDetected: 0,
  avgResponseTime: 0
};

const responseTimes: number[] = [];

export function log(level: LogEntry['level'], component: string, message: string, details?: any) {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    component,
    message,
    details
  };
  
  logs.push(entry);
  
  // Keep only recent logs
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  // Console output
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}`, details || '');
}

export function getLogs(filter?: { level?: string; component?: string; since?: number }): LogEntry[] {
  let result = [...logs];
  
  if (filter?.level) {
    result = result.filter(l => l.level === filter.level);
  }
  if (filter?.component) {
    result = result.filter(l => l.component === filter.component);
  }
  if (filter?.since) {
    result = result.filter(l => l.timestamp >= filter.since!);
  }
  
  return result;
}

export function recordMetric(name: keyof Metrics, value: number = 1) {
  if (name === 'avgResponseTime') {
    responseTimes.push(value);
    if (responseTimes.length > 100) responseTimes.shift();
    metrics.avgResponseTime = Math.round(
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    );
  } else {
    (metrics[name] as number) += value;
  }
}

export function getMetrics(): Metrics {
  return { ...metrics };
}

export function resetMetrics() {
  metrics = {
    apiCalls: 0,
    apiFailures: 0,
    scraperCalls: 0,
    scraperFailures: 0,
    timeout504s: 0,
    emptyResults: 0,
    fakeDataDetected: 0,
    avgResponseTime: 0
  };
  responseTimes.length = 0;
}

/**
 * Alert conditions
 */
export function checkAlerts(): string[] {
  const alerts: string[] = [];
  
  if (metrics.apiFailures / metrics.apiCalls > 0.5) {
    alerts.push('CRITICAL: API failure rate > 50%');
  }
  
  if (metrics.scraperFailures / metrics.scraperCalls > 0.7) {
    alerts.push('WARNING: Scraper failure rate > 70%');
  }
  
  if (metrics.timeout504s > 10) {
    alerts.push('CRITICAL: High 504 timeout rate');
  }
  
  if (metrics.fakeDataDetected > 0) {
    alerts.push('CRITICAL: Fake data detected in results');
  }
  
  if (metrics.avgResponseTime > 30000) {
    alerts.push('WARNING: Average response time > 30s');
  }
  
  return alerts;
}

/**
 * Data quality check
 */
export function validateNoFakeData(flights: any[]): boolean {
  const fakePatterns = [
    /XXX$/,           // Ends with XXX
    /^[A-Z]{2}\d{3}$/, // Format like BA123 (too generic)
    /^[A-Z]{2}0+$/,   // Ends with zeros
  ];
  
  for (const flight of flights) {
    const flightNum = flight.flightNumber || '';
    
    for (const pattern of fakePatterns) {
      if (pattern.test(flightNum)) {
        log('critical', 'VALIDATION', `Fake flight number detected: ${flightNum}`, flight);
        recordMetric('fakeDataDetected');
        return false;
      }
    }
    
    // Check for empty times
    if (!flight.departure?.time || flight.departure.time === '') {
      log('critical', 'VALIDATION', 'Flight with empty departure time', flight);
      recordMetric('fakeDataDetected');
      return false;
    }
  }
  
  return true;
}
