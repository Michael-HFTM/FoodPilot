import { Component, effect, inject, signal } from '@angular/core';
import { Feeding, FeedingSchedule as Schedule, ScheduleCreate, Size, SIZES } from '../../services/feeding';
import { Overlay } from '../../services/overlay';

const SIZE_LABELS: Record<Size, string> = {
  small: 'Klein',
  medium: 'Mittel',
  large: 'Gross',
};

@Component({
  selector: 'app-feeding-schedule',
  imports: [],
  templateUrl: './feeding-schedule.html',
  styleUrl: './feeding-schedule.scss',
})
export class FeedingSchedule {
  private readonly feeding = inject(Feeding);
  private readonly overlay = inject(Overlay);

  constructor() {
    effect(() => {
      this.overlay.anyOpen.set(this.formOpen() || this.deleteTarget() !== null);
    });
    this.load();
  }

  readonly nameSuggestions = ['Morgens', 'Mittags', 'Abends', 'Spät'];
  readonly sizes = SIZES;
  readonly sizeLabel = (s: Size): string => SIZE_LABELS[s];

  readonly schedules = signal<Schedule[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formName = signal('');
  readonly formTime = signal('08:00');
  readonly formSize = signal<Size>('medium');
  readonly formEnabled = signal(true);
  readonly formError = signal<string | null>(null);
  readonly formSaving = signal(false);

  readonly deleteTarget = signal<Schedule | null>(null);
  readonly deleteBusy = signal(false);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.feeding.list().subscribe({
      next: (data) => {
        this.schedules.set([...data].sort((a, b) => a.time.localeCompare(b.time)));
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formTime.set('08:00');
    this.formSize.set('medium');
    this.formEnabled.set(true);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEdit(s: Schedule): void {
    this.editingId.set(s.id);
    this.formName.set(s.name);
    this.formTime.set(s.time);
    this.formSize.set(s.size);
    this.formEnabled.set(s.enabled);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.formSaving()) return;
    this.formOpen.set(false);
  }

  save(ev: Event): void {
    ev.preventDefault();
    const name = this.formName().trim();
    const time = this.formTime();
    const size = this.formSize();

    if (!name) {
      this.formError.set('Name ist erforderlich.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      this.formError.set('Uhrzeit muss im Format HH:MM sein.');
      return;
    }
    if (!SIZES.includes(size)) {
      this.formError.set('Ungültige Portionsgrösse.');
      return;
    }

    const payload: ScheduleCreate = {
      name,
      time,
      size,
      enabled: this.formEnabled(),
    };

    this.formSaving.set(true);
    this.formError.set(null);

    const id = this.editingId();
    const op$ = id === null ? this.feeding.create(payload) : this.feeding.update(id, payload);
    const fallback = id === null ? 'Plan konnte nicht erstellt werden.' : 'Plan konnte nicht aktualisiert werden.';

    op$.subscribe({
      next: () => {
        this.formSaving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (err: Error) => {
        this.formSaving.set(false);
        this.formError.set(err.message || fallback);
      },
    });
  }

  askDelete(s: Schedule): void {
    this.deleteTarget.set(s);
  }

  cancelDelete(): void {
    if (this.deleteBusy()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteBusy.set(true);
    this.feeding.delete(target.id).subscribe({
      next: () => {
        this.deleteBusy.set(false);
        this.deleteTarget.set(null);
        this.schedules.update((list) => list.filter((s) => s.id !== target.id));
      },
      error: (err: Error) => {
        this.deleteBusy.set(false);
        this.deleteTarget.set(null);
        this.error.set(err.message);
      },
    });
  }

  toggleEnabled(s: Schedule): void {
    const newEnabled = !s.enabled;
    const original = { ...s };
    this.schedules.update((list) =>
      list.map((item) => (item.id === s.id ? { ...item, enabled: newEnabled } : item)),
    );
    this.feeding
      .update(s.id, {
        name: s.name,
        time: s.time,
        size: s.size,
        enabled: newEnabled,
      })
      .subscribe({
        next: (updated) => {
          this.schedules.update((list) =>
            list.map((item) => (item.id === s.id ? updated : item)),
          );
        },
        error: (err: Error) => {
          this.schedules.update((list) =>
            list.map((item) => (item.id === s.id ? original : item)),
          );
          this.error.set(err.message);
        },
      });
  }

  protected inputValue(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }

  protected isChecked(ev: Event): boolean {
    return (ev.target as HTMLInputElement).checked;
  }
}
