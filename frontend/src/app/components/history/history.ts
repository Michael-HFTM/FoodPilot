import { Component, computed, effect, inject, signal } from '@angular/core';

import { Size } from '../../services/feeding';
import { FeedingLog, History as HistoryService } from '../../services/history';
import { Overlay } from '../../services/overlay';

const SIZE_LABELS: Record<Size, string> = {
  small: 'Klein',
  medium: 'Mittel',
  large: 'Gross',
};

@Component({
  selector: 'app-history',
  templateUrl: './history.html',
})
export class History {
  private readonly historyService = inject(HistoryService);
  private readonly overlay = inject(Overlay);

  readonly logs = signal<FeedingLog[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly limit = signal(50);
  readonly hasMore = computed(() => this.logs().length === this.limit());

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
    this.historyService.list(this.limit()).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.limit.update((n) => n + 50);
    this.load();
  }

  sizeLabel(size: Size): string {
    return SIZE_LABELS[size];
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-CH');
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  }
}
