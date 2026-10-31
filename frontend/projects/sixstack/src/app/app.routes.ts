import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: '6ixstack · Every dev event in the 6ix',
    loadComponent: () => import('./pages/events/events-page').then((m) => m.EventsPage),
  },
];
