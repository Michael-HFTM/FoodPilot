import { inject, Service } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface StatusData {
  readonly fill_level: number | null;
  readonly is_blocked: boolean;
}

@Service()
export class StatusService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/status';

  get(): Observable<StatusData> {
    return this.http.get<StatusData>(`${this.baseUrl}/`).pipe(
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
    return new Error('Status konnte nicht geladen werden');
  }
}
