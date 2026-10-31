import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideSixstackOverlays } from 'components';
import {
  apiErrorInterceptor,
  EVENTS_API,
  HttpEventsApi,
  HttpSiteApi,
  NETWORK_ERROR_LISTENER,
  SITE_API,
} from 'api';
import { routes } from './app.routes';
import { ConnectivityService } from './shell/banners/connectivity.service';
import { MaintenanceNoticeSource } from './shell/banners/maintenance-notice-source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSixstackOverlays(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([apiErrorInterceptor]),
    ),
    {
      provide: NETWORK_ERROR_LISTENER,
      useFactory: () => {
        const connectivity = inject(ConnectivityService);
        return () => connectivity.reportNetworkError();
      },
    },
    { provide: SITE_API, useClass: HttpSiteApi },
    { provide: EVENTS_API, useClass: HttpEventsApi },
    provideAppInitializer(() => inject(MaintenanceNoticeSource).load()),
  ],
};
