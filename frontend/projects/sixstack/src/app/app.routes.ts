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
    path: 'organize',
    title: 'Your events · 6ixstack',
    data: { hideSubmit: true },
    canActivate: [authGuard],
    loadComponent: () => import('./pages/organize/organize-page').then((m) => m.OrganizePage),
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
