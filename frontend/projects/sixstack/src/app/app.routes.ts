import { authGuard } from './shell/session/auth-guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: '6ixstack · Every dev event in the 6ix',
    loadComponent: () => import('./pages/events/events-page').then((m) => m.EventsPage),
  },
  {
    path: 'events/:slug',
    title: 'Event · 6ixstack',
    loadComponent: () => import('./pages/event-detail/event-detail-page').then((m) => m.EventDetailPage),
  },
  {
    path: 'calendar',
    title: 'Calendar · 6ixstack',
    loadComponent: () => import('./pages/calendar/calendar-page').then((m) => m.CalendarPage),
  },
  {
    path: 'feeds',
    title: 'Calendar feeds · 6ixstack',
    loadComponent: () =>
      import('./pages/calendar-feeds/calendar-feeds-page').then((m) => m.CalendarFeedsPage),
  },
  {
    path: 'submit',
    title: 'Submit an event · 6ixstack',
    data: { hideSubmit: true },
    loadComponent: () => import('./pages/submit-event/submit-event-page').then((m) => m.SubmitEventPage),
  },
  {
    path: 'sign-in',
    title: 'Sign in · 6ixstack',
    data: { hideSubmit: true },
    loadComponent: () => import('./pages/sign-in/sign-in-page').then((m) => m.SignInPage),
  },
  {
    path: 'communities',
    title: 'Communities · 6ixstack',
    loadComponent: () => import('./pages/communities/communities-page').then((m) => m.CommunitiesPage),
  },
  {
    path: 'speakers',
    title: 'Speakers · 6ixstack',
    loadComponent: () => import('./pages/speakers/speakers-page').then((m) => m.SpeakersPage),
  },
  {
    path: 'speakers/:slug',
    title: 'Speaker · 6ixstack',
    loadComponent: () =>
      import('./pages/speaker-detail/speaker-detail-page').then((m) => m.SpeakerDetailPage),
  },
  {
    path: 'communities/:slug',
    title: 'Community · 6ixstack',
    loadComponent: () =>
      import('./pages/community-detail/community-detail-page').then((m) => m.CommunityDetailPage),
  },
  {
    path: 'notifications',
    title: 'Notifications · 6ixstack',
    data: { hideSubmit: true },
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications/notifications-page').then((m) => m.NotificationsPage),
  },
  {
    path: 'organize',
    title: 'Your events · 6ixstack',
    data: { hideSubmit: true },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/organizer-dashboard/organizer-dashboard-page').then((m) => m.OrganizerDashboardPage),
  },
  {
    path: 'organize/events/:id/edit',
    title: 'Edit event · 6ixstack',
    data: { hideSubmit: true },
    canActivate: [authGuard],
    loadComponent: () => import('./pages/edit-event/edit-event-page').then((m) => m.EditEventPage),
  },
  {
    path: 'admin/review',
    title: 'Review queue · 6ixstack',
    data: { hideSubmit: true },
    canActivate: [authGuard],
    loadComponent: () => import('./pages/review-queue/review-queue-page').then((m) => m.ReviewQueuePage),
  },
  {
    path: '**',
    title: 'Page not found · 6ixstack',
    loadComponent: () => import('./pages/status/not-found-page').then((m) => m.NotFoundPage),
  },
];
