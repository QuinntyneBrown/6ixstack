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
  FEEDS_API,
  AUTH_API,
  HttpAuthApi,
  HttpEventsApi,
  HttpFeedsApi,
  HttpModerationApi,
  HttpNotificationsApi,
  HttpCommunitiesApi,
  HttpOrganizerEventsApi,
  HttpReferenceDataApi,
  HttpSubmissionsApi,
  HttpSiteApi,
  NETWORK_ERROR_LISTENER,
  MODERATION_API,
  NOTIFICATIONS_API,
  COMMUNITIES_API,
  ORGANIZER_EVENTS_API,
  REFERENCE_DATA_API,
  SITE_API,
  SUBMISSIONS_API,
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
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: EVENTS_API, useClass: HttpEventsApi },
    { provide: FEEDS_API, useClass: HttpFeedsApi },
    { provide: MODERATION_API, useClass: HttpModerationApi },
    { provide: NOTIFICATIONS_API, useClass: HttpNotificationsApi },
    { provide: COMMUNITIES_API, useClass: HttpCommunitiesApi },
    { provide: ORGANIZER_EVENTS_API, useClass: HttpOrganizerEventsApi },
    { provide: REFERENCE_DATA_API, useClass: HttpReferenceDataApi },
    { provide: SUBMISSIONS_API, useClass: HttpSubmissionsApi },
    provideAppInitializer(() => inject(MaintenanceNoticeSource).load()),
  ],
};
