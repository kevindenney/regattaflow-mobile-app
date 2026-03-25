#!/usr/bin/env node
/**
 * Stdio-to-HTTP proxy for the BetterAt MCP server.
 * Claude desktop only supports stdio MCP servers, so this script
 * reads JSON-RPC from stdin, POSTs to the HTTP endpoint, and writes
 * responses to stdout.
 */

const MCP_URL = process.env.MCP_URL || 'http://localhost:3001/api/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN || 'mcp-local-dev-token';

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // JSON-RPC messages are newline-delimited
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);
    if (line) handleMessage(line);
  }
});

process.stdin.on('end', () => {
  if (buffer.trim()) handleMessage(buffer.trim());
});

async function handleMessage(line) {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    process.stderr.write(`[mcp-proxy] Invalid JSON: ${line}\n`);
    return;
  }

  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${MCP_TOKEN}`,
      },
      body: JSON.stringify(parsed),
    });

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // Parse SSE response
      const text = await res.text();
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            process.stdout.write(data + '\n');
          }
        }
      }
    } else {
      // Plain JSON response
      const data = await res.text();
      if (data.trim()) {
        process.stdout.write(data.trim() + '\n');
      }
    }
  } catch (err) {
    process.stderr.write(`[mcp-proxy] Fetch error: ${err.message}\n`);
    // Return JSON-RPC error if this was a request (has an id)
    if (parsed.id !== undefined) {
      const errResp = {
        jsonrpc: '2.0',
        error: { code: -32603, message: `Proxy error: ${err.message}` },
        id: parsed.id,
      };
      process.stdout.write(JSON.stringify(errResp) + '\n');
    }
  }
}
