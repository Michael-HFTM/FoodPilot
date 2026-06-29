import { Component, inject, signal } from '@angular/core';
import { Feeding, ManualTriggerResult, Size, SIZES } from '../../services/feeding';
import { Overlay } from '../../services/overlay';

const SIZE_LABELS: Record<Size, string> = {
  small: 'Klein',
  medium: 'Mittel',
  large: 'Gross',
};

@Component({
  selector: 'app-feed-now-fab',
  templateUrl: './feed-now-fab.html',
})
export class FeedNowFab {
  private readonly feeding = inject(Feeding);
  readonly overlay = inject(Overlay);

  readonly sizes = SIZES;
  readonly sizeLabel = (s: Size): string => SIZE_LABELS[s];

  readonly open = signal(false);
  readonly size = signal<Size>('medium');
  readonly busy = signal(false);
  readonly result = signal<{ ok: boolean; msg: string } | null>(null);

  show(): void {
    this.size.set('medium');
    this.result.set(null);
    this.open.set(true);
  }

  close(): void {
    if (this.busy()) return;
    this.open.set(false);
  }

  submit(ev: Event): void {
    ev.preventDefault();
    this.busy.set(true);
    this.result.set(null);
    this.feeding.trigger(this.size()).subscribe({
      next: (res: ManualTriggerResult) => {
        this.busy.set(false);
        this.result.set({
          ok: res.success,
          msg: res.success
            ? `${SIZE_LABELS[res.size]} ausgegeben.`
            : 'Fütterung fehlgeschlagen. Hardware prüfen.',
        });
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.result.set({ ok: false, msg: err.message });
      },
    });
  }
}
