# api

Typed clients for the 6ixstack API. Each client has a contract (an interface), an injection token and an
HTTP implementation. App pages inject the token, so tests and Storybook can supply a fake.

```ts
export interface EventsApi { list(query: EventQuery): Observable<EventPage>; }
export const EVENTS_API = new InjectionToken<EventsApi>('EVENTS_API');
export class HttpEventsApi implements EventsApi { ... }
```

Register implementations in the app's `app.config.ts` with `{ provide: EVENTS_API, useClass: HttpEventsApi }`.
