import { Component, inject, signal } from '@angular/core';
import { Feeding, FeedingSchedule as Schedule, ManualTriggerResult, ScheduleCreate } from '../../services/feeding';

@Component({
  selector: 'app-feeding-schedule',
  imports: [],
  templateUrl: './feeding-schedule.html',
  styleUrl: './feeding-schedule.scss',
})
export class FeedingSchedule {
  private readonly feeding = inject(Feeding);

  readonly nameSuggestions = ['Morgens', 'Mittags', 'Abends', 'Spät'];

  readonly schedules = signal<Schedule[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formName = signal('');
  readonly formTime = signal('08:00');
  readonly formPortion = signal(50);
  readonly formEnabled = signal(true);
  readonly formError = signal<string | null>(null);
  readonly formSaving = signal(false);

  readonly deleteTarget = signal<Schedule | null>(null);
  readonly deleteBusy = signal(false);

  readonly triggerOpen = signal(false);
  readonly triggerPortion = signal(50);
  readonly triggerBusy = signal(false);
  readonly triggerResult = signal<{ ok: boolean; msg: string } | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.feeding.list().subscribe({
      next: (data) => {
        this.schedules.set(data);
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
    this.formPortion.set(50);
    this.formEnabled.set(true);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEdit(s: Schedule): void {
    this.editingId.set(s.id);
    this.formName.set(s.name);
    this.formTime.set(s.time);
    this.formPortion.set(s.portion_g);
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
    const portion = this.formPortion();

    if (!name) {
      this.formError.set('Name ist erforderlich.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      this.formError.set('Uhrzeit muss im Format HH:MM sein.');
      return;
    }
    if (!(portion > 0)) {
      this.formError.set('Portion muss größer als 0 sein.');
      return;
    }

    const payload: ScheduleCreate = {
      name,
      time,
      portion_g: portion,
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
        portion_g: s.portion_g,
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

  openTrigger(): void {
    this.triggerPortion.set(50);
    this.triggerResult.set(null);
    this.triggerOpen.set(true);
  }

  closeTrigger(): void {
    if (this.triggerBusy()) return;
    this.triggerOpen.set(false);
  }

  runTrigger(ev: Event): void {
    ev.preventDefault();
    const portion = this.triggerPortion();
    if (!(portion > 0)) {
      this.triggerResult.set({ ok: false, msg: 'Portion muss größer als 0 sein.' });
      return;
    }
    this.triggerBusy.set(true);
    this.triggerResult.set(null);
    this.feeding.trigger(portion).subscribe({
      next: (res: ManualTriggerResult) => {
        this.triggerBusy.set(false);
        this.triggerResult.set({
          ok: res.success,
          msg: res.success
            ? `${res.portion_g} g ausgegeben.`
            : 'Fütterung fehlgeschlagen. Hardware prüfen.',
        });
      },
      error: (err: Error) => {
        this.triggerBusy.set(false);
        this.triggerResult.set({ ok: false, msg: err.message });
      },
    });
  }

  protected inputValue(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }

  protected inputNumber(ev: Event): number {
    return (ev.target as HTMLInputElement).valueAsNumber || 0;
  }

  protected isChecked(ev: Event): boolean {
    return (ev.target as HTMLInputElement).checked;
  }
}
