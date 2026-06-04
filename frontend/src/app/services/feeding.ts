import { inject, Service } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type Size = 'small' | 'medium' | 'large';

export const SIZES: readonly Size[] = ['small', 'medium', 'large'] as const;

export interface FeedingSchedule {
  readonly id: number;
  readonly name: string;
  readonly time: string;
  readonly size: Size;
  readonly enabled: boolean;
  readonly created_at: string;
}

export type ScheduleCreate = Omit<FeedingSchedule, 'id' | 'created_at'>;

export interface ManualTriggerResult {
  readonly success: boolean;
  readonly size: Size;
}

@Service()
export class Feeding {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/feeding';

  list(): Observable<FeedingSchedule[]> {
    return this.http.get<FeedingSchedule[]>(`${this.baseUrl}/`).pipe(
      catchError((err) => throwError(() => this.toMessage(err, 'Plan-Liste konnte nicht geladen werden'))),
    );
  }

  create(payload: ScheduleCreate): Observable<FeedingSchedule> {
    return this.http.post<FeedingSchedule>(`${this.baseUrl}/`, payload).pipe(
      catchError((err) => throwError(() => this.toMessage(err, 'Plan konnte nicht erstellt werden'))),
    );
  }

  update(id: number, payload: ScheduleCreate): Observable<FeedingSchedule> {
    return this.http.put<FeedingSchedule>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError((err) => throwError(() => this.toMessage(err, 'Plan konnte nicht aktualisiert werden'))),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => throwError(() => this.toMessage(err, 'Plan konnte nicht gelöscht werden'))),
    );
  }

  trigger(size: Size): Observable<ManualTriggerResult> {
    return this.http
      .post<ManualTriggerResult>(`${this.baseUrl}/trigger`, null, {
        params: { size },
      })
      .pipe(catchError((err) => throwError(() => this.toMessage(err, 'Manuelle Fütterung fehlgeschlagen'))));
  }

  private toMessage(err: unknown, fallback: string): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return new Error('Backend nicht erreichbar. Läuft der FastAPI-Server auf Port 8000?');
      }
      const detail = (err.error as { detail?: unknown } | null)?.detail;
      if (typeof detail === 'string' && detail.length > 0) {
        return new Error(detail);
      }
    }
    return new Error(fallback);
  }
}
