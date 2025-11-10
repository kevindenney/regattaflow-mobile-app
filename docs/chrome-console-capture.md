# Chrome Console Capture

Use this workflow when you want Codex to analyse Chrome DevTools console output alongside Metro logs while developing the Expo web experience.

## 1. Launch Chrome with remote debugging enabled

```sh
open -na "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --user-data-dir="$PWD/.chrome-devtools" \
  http://localhost:8081
```

You can customise the launch URL; Codex looks for targets whose URL contains `http://localhost:8081` by default.

## 2. Stream console events into the repo

```sh
node scripts/capture-chrome-console.mjs \
  | tee logs/chrome-console.log
```

The script automatically:

- waits for the Expo web tab exposed at the remote debugging port,
- subscribes to `Runtime.consoleAPICalled`, `Log.entryAdded`, and `Runtime.exceptionThrown`,
- writes structured JSONL entries to `logs/chrome-console.jsonl`, and
- mirrors human-readable output to `logs/chrome-console.log` (and stdout).

Leave this process running while you iterate. Restart it if you close Chrome or change the debugging port.

### Environment overrides

You can tweak the defaults with environment variables:

- `CHROME_DEVTOOLS_PORT` – change the remote debugging port (defaults to `9222`).
- `CHROME_DEVTOOLS_HOST` – host/IP to connect to (defaults to `127.0.0.1`).
- `CHROME_TARGET_URL_MATCH` – substring used to pick the right tab (defaults to `http://localhost:8081`).

## 3. Ask Codex for insights

Once the log files start filling, share line references such as `logs/chrome-console.log:42` or `logs/chrome-console.jsonl:42`, and Codex can inspect them together with `logs/metro.log` while suggesting fixes or making automated changes.
