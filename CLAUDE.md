# CLAUDE.md

## Testing

Run the full Playwright integration test suite before committing code:

```bash
npm run test:e2e
```

All 26 tests must pass. If a dev server is already running on port 5173, kill it first or the test runner will fail to start its own.
