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
    path: '**',
    title: 'Page not found · 6ixstack',
    loadComponent: () => import('./pages/status/not-found-page').then((m) => m.NotFoundPage),
  },
];
