import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface AccountSettings {
  name: string;
  email: string;
  pendingEmail: string | null;
  website: string | null;
  emailEventDecisions: boolean;
  emailProblemReports: boolean;
  emailWeeklySummary: boolean;
  community: { name: string; slug: string; coOrganizerCount: number } | null;
}

export interface AccountSettingsUpdate {
  name: string;
  email: string;
  website: string | null;
  emailEventDecisions: boolean;
  emailProblemReports: boolean;
  emailWeeklySummary: boolean;
}

export interface SettingsSaved {
  savedAtLabel: string;
  pendingEmail: string | null;
}

export interface AccountApi {
  settings(): Observable<AccountSettings>;
  /** Saves the settings; 400 carries field errors for name, email and website (L2-068). */
  save(update: AccountSettingsUpdate): Observable<SettingsSaved>;
}

export const ACCOUNT_API = new InjectionToken<AccountApi>('ACCOUNT_API');

@Injectable()
export class HttpAccountApi implements AccountApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  settings(): Observable<AccountSettings> {
    return this.http.get<AccountSettings>(`${this.baseUrl}/api/account/settings`);
  }

  save(update: AccountSettingsUpdate): Observable<SettingsSaved> {
    return this.http.put<SettingsSaved>(`${this.baseUrl}/api/account/settings`, update);
  }
}
