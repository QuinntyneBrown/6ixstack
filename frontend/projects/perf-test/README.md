# perf-test

Render-performance scenarios for the `components` library, modelled on Fluent UI's `apps/perf-test`.

Each file in `src/scenarios/` renders many instances of one component (`<Name>.ts`, registered in
`src/scenarios/index.ts`). Every new component gets a scenario.

```bash
cd frontend
npm run perf-test                                   # all scenarios, 1000 instances, 5 runs each
npm run perf-test -- --scenario Icon --runs 10      # one scenario
```

The runner builds this app, serves it on port 4301, opens each scenario in headless Chromium
(`?scenario=<Name>&iterations=<n>`), reads the time from bootstrap to first render, and writes
`dist/perf-test/report.json` with the median of the runs. Compare reports before and after a change to a
component; there is no fixed budget yet.

To look at a scenario by hand: `npx ng serve perf-test` and open http://localhost:4300.
