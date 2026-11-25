# Playwright test data isolation

This standalone portfolio demo uses a synthetic reservation store backed by a temporary directory. It shows why two independent Playwright workers can still interfere when they target the same record. The journey names label two independent tests. The demo exercises the data collision directly and does not launch a browser.

## Run the comparison

Install Node.js 20 or later, then run:

```sh
npm ci
npm run demo
```

The comparison runs two tests three times in each mode, with two workers and zero retries. In shared mode, both workers attempt to reserve one slot, so one test passes and one receives an already-reserved result. In isolated mode, each worker receives its own slot and both pass. A fresh store is created for each comparison run and removed afterward.

See `reports/results.json` for the measured local runs. The GitHub Actions workflow runs the same comparison and uploads its results. The demo uses synthetic data and represents no client or employer system.
