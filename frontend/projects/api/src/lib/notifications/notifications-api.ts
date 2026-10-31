import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface AppNotification {
  id: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  title: string;
  text: string | null;
  link: string;
  timeLabel: string;
  isRead: boolean;
}

export interface NotificationList {
  unreadCount: number;
  items: AppNotification[];
}

export interface NotificationsApi {
  list(): Observable<NotificationList>;
  markRead(id: string): Observable<void>;
  markAllRead(): Observable<void>;
}

export const NOTIFICATIONS_API = new InjectionToken<NotificationsApi>('NOTIFICATIONS_API');

@Injectable()
export class HttpNotificationsApi implements NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<NotificationList> {
    return this.http.get<NotificationList>(`${this.baseUrl}/api/notifications`);
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/notifications/${encodeURIComponent(id)}/read`, null);
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/notifications/read-all`, null);
  }
}
