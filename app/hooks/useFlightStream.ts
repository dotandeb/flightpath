'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface StreamedFlight {
  id: string;
  source: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  bookingLink: string;
}

export interface StreamedSplitTicket {
  id: string;
  legs: Array<{
    from: string;
    to: string;
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    price: number;
    bookingLink: string;
  }>;
  totalPrice: number;
  savings: number;
  feasibility: 'good' | 'tight' | 'risky';
  riskScore: number;
  warnings: string[];
}

interface StreamState {
  status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';
  progress: number;
  message: string;
  flights: StreamedFlight[];
  splitTickets: StreamedSplitTicket[];
  sources: string[];
  error?: string;
}

interface UseFlightStreamReturn {
  // State
  status: StreamState['status'];
  progress: number;
  message: string;
  flights: StreamedFlight[];
  splitTickets: StreamedSplitTicket[];
  sources: string[];
  error?: string;
  
  // Actions
  startSearch: (params: SearchParams) => Promise<void>;
  cancelSearch: () => void;
  
  // Meta
  isSearching: boolean;
  hasResults: boolean;
  hasSplitTickets: boolean;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelClass?: string;
}

/**
 * React hook for streaming flight search
 * Uses Server-Sent Events for real-time results
 * NEVER times out - streams until complete
 */
export function useFlightStream(): UseFlightStreamReturn {
  const [state, setState] = useState<StreamState>({
    status: 'idle',
    progress: 0,
    message: '',
    flights: [],
    splitTickets: [],
    sources: []
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSearch();
    };
  }, []);
  
  const startSearch = useCallback(async (params: SearchParams) => {
    // Reset state
    setState({
      status: 'connecting',
      progress: 0,
      message: 'Starting search...',
      flights: [],
      splitTickets: [],
      sources: []
    });
    
    // Cancel any existing search
    cancelSearch();
    
    try {
      // Step 1: Start search session
      const response = await fetch('/api/stream/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start search');
      }
      
      const { sessionId, streamUrl } = await response.json();
      
      // Step 2: Connect to SSE stream
      connectToStream(sessionId, streamUrl);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Search failed'
      }));
    }
  }, []);
  
  const connectToStream = useCallback((sessionId: string, streamUrl: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Create new EventSource
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setState(prev => ({
        ...prev,
        status: 'streaming',
        message: 'Connected - receiving results...'
      }));
    };
    
    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        handleStreamUpdate(update);
      } catch (e) {
        console.warn('Invalid SSE message:', event.data);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      
      // Don't treat as fatal error - we might have partial results
      setState(prev => ({
        ...prev,
        status: prev.flights.length > 0 ? 'complete' : 'error',
        error: prev.flights.length > 0 ? undefined : 'Connection lost'
      }));
      
      eventSource.close();
    };
  }, []);
  
  const handleStreamUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'connected':
        setState(prev => ({
          ...prev,
          status: 'streaming',
          message: 'Search started...'
        }));
        break;
        
      case 'progress':
        setState(prev => ({
          ...prev,
          progress: update.progress || prev.progress,
          message: update.message || prev.message
        }));
        break;
        
      case 'flights':
        setState(prev => ({
          ...prev,
          flights: update.data || [],
          progress: update.progress || prev.progress,
          message: `Found ${update.data?.length || 0} flights...`
        }));
        break;
        
      case 'splitTickets':
        setState(prev => ({
          ...prev,
          splitTickets: update.data || [],
          message: `Found ${update.data?.length || 0} split ticket options...`
        }));
        break;
        
      case 'complete':
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: 100,
          message: 'Search complete!',
          flights: update.data?.flights || prev.flights,
          splitTickets: update.data?.splitTickets || prev.splitTickets,
          sources: update.data?.sources || prev.sources
        }));
        
        // Close connection
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        break;
        
      case 'error':
        // Non-fatal error - keep results
        setState(prev => ({
          ...prev,
          status: prev.flights.length > 0 ? 'complete' : 'error',
          error: update.message,
          message: update.message
        }));
        
        if (update.data) {
          setState(prev => ({
            ...prev,
            flights: update.data.flights || prev.flights,
            splitTickets: update.data.splitTickets || prev.splitTickets,
            sources: update.data.sources || prev.sources
          }));
        }
        
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        break;
    }
  }, []);
  
  const cancelSearch = useCallback(() => {
    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset state if not already complete
    setState(prev => 
      prev.status === 'complete' ? prev : {
        status: 'idle',
        progress: 0,
        message: '',
        flights: [],
        splitTickets: [],
        sources: []
      }
    );
  }, []);
  
  return {
    status: state.status,
    progress: state.progress,
    message: state.message,
    flights: state.flights,
    splitTickets: state.splitTickets,
    sources: state.sources,
    error: state.error,
    startSearch,
    cancelSearch,
    isSearching: state.status === 'connecting' || state.status === 'streaming',
    hasResults: state.flights.length > 0,
    hasSplitTickets: state.splitTickets.length > 0
  };
}
