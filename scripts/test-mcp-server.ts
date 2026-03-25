/**
 * Standalone test server for api/mcp.ts
 * Run: npx tsx scripts/test-mcp-server.ts
 * Then: ./scripts/test-mcp.sh --local
 */
import http from 'http';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(__dirname, '../.env.local') });
config({ path: path.resolve(__dirname, '../.env') });

async function start() {
  const { default: handler } = await import('../api/mcp');

  const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Collect body
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const bodyStr = Buffer.concat(chunks).toString();

    let body: any = {};
    try {
      body = bodyStr ? JSON.parse(bodyStr) : {};
    } catch {
      console.error('Failed to parse body:', bodyStr.slice(0, 200));
    }

    console.log('  method:', body.method ?? '(no method)');

    // Vercel-style req augmentation
    (req as any).body = body;
    (req as any).query = {};

    // Vercel-style res augmentation
    const origEnd = res.end.bind(res);
    const origWrite = res.write.bind(res);

    (res as any).status = function (code: number) {
      res.statusCode = code;
      return res;
    };

    (res as any).json = function (data: unknown) {
      const json = JSON.stringify(data);
      console.log('  response (json):', json.slice(0, 200));
      res.setHeader('Content-Type', 'application/json');
      res.end(json);
      return res;
    };

    // Log writes for debugging
    (res as any).write = function (...args: any[]) {
      const data = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
      console.log('  response (write):', data?.slice(0, 200));
      return origWrite(...args);
    };

    (res as any).end = function (...args: any[]) {
      if (args[0]) {
        const data = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
        console.log('  response (end):', data?.slice(0, 200));
      }
      return origEnd(...args);
    };

    try {
      await handler(req as any, res as any);
    } catch (err) {
      console.error('Handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
    }
  });

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`MCP test server running at http://localhost:${PORT}/api/mcp`);
    console.log(`Dev token: ${process.env.MCP_DEV_TOKEN}`);
    console.log(`Dev user: ${process.env.MCP_DEV_USER_ID}`);
    console.log('Press Ctrl+C to stop\n');
  });
}

start().catch(console.error);
