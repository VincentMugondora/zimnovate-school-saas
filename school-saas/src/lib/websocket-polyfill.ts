// WebSocket polyfill for Node.js < 22
// This must be imported before any Supabase client initialization

// Check if we're in a Node.js environment without native WebSocket
if (typeof globalThis !== 'undefined' && typeof globalThis.WebSocket === 'undefined') {
  try {
    // Use dynamic require for Node.js compatibility
    const ws = require('ws');
    globalThis.WebSocket = ws;
    console.log('WebSocket polyfill loaded successfully');
  } catch (error) {
    console.warn('WebSocket polyfill not available:', error.message);
  }
}
