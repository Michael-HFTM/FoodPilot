import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { FeedingLog, History } from '../../services/history';
import { Overlay } from '../../services/overlay';
import { StatusData, StatusService } from '../../services/status';
import { Size } from '../../services/feeding';

const POLL_INTERVAL_MS = 10_000;

@Component({
  selector: 'app-status',
  templateUrl: './status.html',
})
export class Status {
  private readonly statusService = inject(StatusService);
  private readonly historyService = inject(History);
  private readonly overlay = inject(Overlay);

  readonly data = signal<StatusData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly todayCount = signal<number | null>(null);
  readonly todaySizes = signal<Record<Size, number> | null>(null);
  readonly lastFeeding = signal<FeedingLog | null>(null);

  constructor() {
    this.load();
    effect(() => {
      if (this.overlay.lastFeedAt() > 0) {
        this.load();
      }
    });
    interval(POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.statusService.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });

    this.historyService.list(500).subscribe({
      next: (logs) => {
        const today = new Date().toLocaleDateString('de-CH');
        const todayLogs = logs.filter(
          (l) => l.success && new Date(l.triggered_at).toLocaleDateString('de-CH') === today,
        );
        this.todayCount.set(todayLogs.length);
        this.todaySizes.set({
          small:  todayLogs.filter((l) => l.size === 'small').length,
          medium: todayLogs.filter((l) => l.size === 'medium').length,
          large:  todayLogs.filter((l) => l.size === 'large').length,
        });

        const latest = logs.reduce<FeedingLog | null>((latest, log) => {
          if (!latest || new Date(log.triggered_at) > new Date(latest.triggered_at)) {
            return log;
          }
          return latest;
        }, null);
        this.lastFeeding.set(latest);
      },
      error: () => {
        this.todayCount.set(null);
        this.todaySizes.set(null);
        this.lastFeeding.set(null);
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-CH');
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  }
}
