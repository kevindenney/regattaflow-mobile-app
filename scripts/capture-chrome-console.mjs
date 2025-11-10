#!/usr/bin/env node

/**
 * Streams Chrome DevTools console events for the Expo web tab into
 * logs/chrome-console.log and logs/chrome-console.jsonl.
 * Requires Chrome to be running with --remote-debugging-port=9222.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket } from 'undici';

const DEVTOOLS_HOST = process.env.CHROME_DEVTOOLS_HOST ?? '127.0.0.1';
const DEVTOOLS_PORT = Number(process.env.CHROME_DEVTOOLS_PORT ?? 9222);
const TARGET_MATCH = process.env.CHROME_TARGET_URL_MATCH ?? 'http://localhost:8081';
const RETRY_MS = Number(process.env.CHROME_DEVTOOLS_RETRY_MS ?? 1500);

const logsDir = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const textLogPath = path.join(logsDir, 'chrome-console.log');
const jsonLogPath = path.join(logsDir, 'chrome-console.jsonl');

const textStream = fs.createWriteStream(textLogPath, { flags: 'a' });
const jsonStream = fs.createWriteStream(jsonLogPath, { flags: 'a' });

function shutdown(code = 0) {
  textStream.end();
  jsonStream.end();
  process.exit(code);
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));

function toEpochMs(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return Date.now();
  }

  if (value > 9.22e12) {
    return Math.floor(value / 1000); // convert from nanoseconds
  }

  if (value > 9.22e9) {
    return Math.floor(value); // already in milliseconds
  }

  return Math.floor(value * 1000); // assume seconds
}

function formatLocation({ url, lineNumber, columnNumber }) {
  if (!url) {
    return null;
  }
  const line = typeof lineNumber === 'number' ? lineNumber + 1 : 0;
  const column = typeof columnNumber === 'number' ? columnNumber + 1 : 0;
  return `${url}:${line}:${column}`;
}

function formatRemoteObject(arg) {
  if (!arg) {
    return 'undefined';
  }

  if ('value' in arg && arg.value !== undefined) {
    if (typeof arg.value === 'object') {
      try {
        return JSON.stringify(arg.value);
      } catch {
        return arg.value === null ? 'null' : '[object]';
      }
    }
    return String(arg.value);
  }

  if (arg.type === 'undefined') {
    return 'undefined';
  }

  if (arg.type === 'function') {
    return arg.description?.split('\n')[0] ?? '[function]';
  }

  return arg.description ?? arg.unserializableValue ?? `[${arg.type}]`;
}

function writeEntry(entry) {
  const iso = new Date(entry.timestamp).toISOString();
  let line = `[${iso}] [${entry.source}] [${entry.level}] ${entry.message}`;

  if (entry.location) {
    line += ` (${entry.location})`;
  }

  textStream.write(`${line}\n`);
  jsonStream.write(`${JSON.stringify(entry)}\n`);
  process.stdout.write(`${line}\n`);

  if (entry.stack && entry.stack.length) {
    const stackLines = entry.stack.map((frame) => `    at ${frame}`);
    const stackText = `${stackLines.join('\n')}\n`;
    textStream.write(stackText);
    process.stdout.write(stackText);
  }
}

async function fetchTarget() {
  const url = `http://${DEVTOOLS_HOST}:${DEVTOOLS_PORT}/json/list`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`DevTools list request failed (${response.status})`);
  }

  const items = await response.json();
  const page = items.find(
    (item) =>
      item.type === 'page' &&
      typeof item.url === 'string' &&
      item.url.includes(TARGET_MATCH)
  );

  if (!page) {
    return null;
  }

  return {
    id: page.id,
    title: page.title,
    url: page.url,
    wsUrl: page.webSocketDebuggerUrl,
  };
}

async function waitForTarget() {
  while (true) {
    try {
      const target = await fetchTarget();
      if (target) {
        return target;
      }
      process.stdout.write(
        `Waiting for Chrome target matching "${TARGET_MATCH}"...\n`
      );
    } catch (error) {
      process.stderr.write(`Failed to query DevTools targets: ${error}\n`);
    }

    await delay(RETRY_MS);
  }
}

async function captureLoop() {
  while (true) {
    const target = await waitForTarget();
    process.stdout.write(
      `Connected to Chrome target "${target.title}" (${target.url})\n`
    );

    try {
      await captureTarget(target);
    } catch (error) {
      process.stderr.write(`Capture failed: ${error}\n`);
      await delay(RETRY_MS);
    }
  }
}

async function captureTarget(target) {
  const ws = new WebSocket(target.wsUrl);
  let nextMessageId = 1;
  const pending = new Map();

  const send = (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextMessageId++;
      const payload = JSON.stringify({ id, method, params });
      pending.set(id, { resolve, reject, method });

      try {
        ws.send(payload);
      } catch (error) {
        pending.delete(id);
        reject(error);
        return;
      }

      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Timeout waiting for response to ${method}`));
        }
      }, 5000);
    });

  ws.addEventListener('message', (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      process.stderr.write(`Malformed DevTools message: ${error}\n`);
      return;
    }

    if (data.id) {
      const handler = pending.get(data.id);
      if (handler) {
        pending.delete(data.id);
        if (data.error) {
          handler.reject(
            new Error(
              `DevTools error for ${handler.method}: ${data.error.message}`
            )
          );
        } else {
          handler.resolve(data.result);
        }
      }
      return;
    }

    if (!data.method) {
      return;
    }

    switch (data.method) {
      case 'Runtime.consoleAPICalled':
        handleConsoleEvent(data.params);
        break;
      case 'Runtime.exceptionThrown':
        handleException(data.params);
        break;
      case 'Log.entryAdded':
        handleLogEntry(data.params.entry);
        break;
      default:
        break;
    }
  });

  ws.addEventListener('close', () => {
    pending.forEach(({ reject }) => reject(new Error('WebSocket closed')));
    pending.clear();
    process.stdout.write('Chrome DevTools connection closed. Reconnecting…\n');
  });

  ws.addEventListener('error', (event) => {
    const reason =
      event?.message ??
      event?.error?.message ??
      (event?.error ? String(event.error) : 'unknown error');
    process.stderr.write(`Chrome DevTools WebSocket error: ${reason}\n`);
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  await Promise.all([
    send('Runtime.enable'),
    send('Log.enable'),
    send('Page.enable'),
  ]);

  await send('Runtime.runIfWaitingForDebugger');

  await new Promise((resolve) => {
    ws.addEventListener('close', resolve, { once: true });
  });
}

function handleConsoleEvent(params) {
  const message = params.args.map(formatRemoteObject).join(' ');
  const location =
    params.stackTrace?.callFrames?.length
      ? formatLocation(params.stackTrace.callFrames[0])
      : null;

  const stack =
    params.stackTrace?.callFrames?.slice(1).map(formatLocation).filter(Boolean) ??
    [];

  writeEntry({
    source: 'console',
    level: params.type,
    message,
    location,
    stack,
    timestamp: toEpochMs(params.timestamp),
  });
}

function handleException(details) {
  const location =
    details.stackTrace?.callFrames?.length
      ? formatLocation(details.stackTrace.callFrames[0])
      : formatLocation(details);

  const stack =
    details.stackTrace?.callFrames?.slice(1).map(formatLocation).filter(Boolean) ??
    [];

  writeEntry({
    source: 'exception',
    level: 'error',
    message: details.exception?.description ?? details.text ?? 'Uncaught error',
    location,
    stack,
    timestamp: toEpochMs(details.timestamp ?? Date.now()),
  });
}

function handleLogEntry(entry) {
  const location = entry.url
    ? `${entry.url}:${(entry.lineNumber ?? 0) + 1}:${(entry.columnNumber ?? 0) + 1}`
    : null;

  writeEntry({
    source: entry.source ?? 'log',
    level: entry.level ?? 'info',
    message: entry.text ?? '',
    location,
    stack: entry.stackTrace?.callFrames
      ?.map(formatLocation)
      .filter(Boolean) ?? [],
    timestamp: toEpochMs(entry.timestamp ?? Date.now()),
  });
}

captureLoop().catch((error) => {
  process.stderr.write(`Chrome console capture failed: ${error}\n`);
  shutdown(1);
});
