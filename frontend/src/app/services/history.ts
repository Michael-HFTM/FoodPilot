import { inject, Service } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Size } from './feeding';

export interface FeedingLog {
  readonly id: number;
  readonly schedule_id: number | null;
  readonly triggered_at: string;
  readonly size: Size;
  readonly success: boolean;
  readonly note: string | null;
}

@Service()
export class History {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/history';

  list(limit = 50): Observable<FeedingLog[]> {
    return this.http.get<FeedingLog[]>(`${this.baseUrl}/`, { params: { limit } }).pipe(
      catchError((err) => throwError(() => this.toMessage(err))),
    );
  }

  private toMessage(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return new Error('Backend nicht erreichbar. Läuft der FastAPI-Server auf Port 8000?');
      }
      const detail = (err.error as { detail?: unknown } | null)?.detail;
      if (typeof detail === 'string' && detail.length > 0) {
        return new Error(detail);
      }
    }
    return new Error('Verlauf konnte nicht geladen werden');
  }
}
