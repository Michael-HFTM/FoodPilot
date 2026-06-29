import { Component, computed, effect, inject, signal } from '@angular/core';

import { History } from '../../services/history';
import { Overlay } from '../../services/overlay';
import { StatusData, StatusService } from '../../services/status';
import { Size } from '../../services/feeding';

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

  readonly fillPercent = computed(() => {
    const level = this.data()?.fill_level;
    return level !== null && level !== undefined ? Math.round(level * 100) : null;
  });

  readonly fillColor = computed(() => {
    const pct = this.fillPercent();
    if (pct === null) return 'bg-slate-300';
    if (pct >= 40) return 'bg-emerald-500';
    if (pct >= 20) return 'bg-amber-400';
    return 'bg-red-500';
  });

  constructor() {
    this.load();
    effect(() => {
      if (this.overlay.lastFeedAt() > 0) {
        this.load();
      }
    });
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
      },
      error: () => { this.todayCount.set(null); this.todaySizes.set(null); },
    });
  }
}
