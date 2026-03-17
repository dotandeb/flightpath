/**
 * SERVER-SENT EVENTS STREAMING ENDPOINT
 * Real-time flight search results via EventSource
 */

import { NextRequest } from 'next/server';
import { subscribeToSession, unsubscribeFromSession, getSession, StreamUpdate } from '@/lib/stream-sessions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stream/[sessionId] - SSE stream for search results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  
  // Verify session exists
  const session = getSession(sessionId);
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Session not found or expired' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'connected',
        sessionId,
        status: session.status,
        timestamp: Date.now()
      })}\n\n`));
      
      // Subscribe to updates
      const handleUpdate = (update: StreamUpdate) => {
        try {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          // Close stream if complete or error
          if (update.type === 'complete' || update.type === 'error') {
            controller.close();
            unsubscribeFromSession(sessionId, handleUpdate);
          }
        } catch (e) {
          unsubscribeFromSession(sessionId, handleUpdate);
          controller.error(e);
        }
      };
      
      subscribeToSession(sessionId, handleUpdate);
      
      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':heartbeat\n\n'));
        } catch (e) {
          clearInterval(heartbeat);
          unsubscribeFromSession(sessionId, handleUpdate);
        }
      }, 15000);
      
      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribeFromSession(sessionId, handleUpdate);
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
