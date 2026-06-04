import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeedingSchedule } from './feeding-schedule';
import { FeedingSchedule as Schedule } from '../../services/feeding';

const MOCK_SCHEDULES: Schedule[] = [
  { id: 1, name: 'Morgens', time: '07:30', portion_g: 40, enabled: true, created_at: '2026-06-01T00:00:00' },
  { id: 2, name: 'Abends', time: '18:00', portion_g: 50, enabled: false, created_at: '2026-06-01T00:00:00' },
];

describe('FeedingSchedule', () => {
  let fixture: ComponentFixture<FeedingSchedule>;
  let component: FeedingSchedule;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedingSchedule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushList(data: Schedule[] = []): void {
    const req = httpMock.expectOne('/api/feeding/');
    expect(req.request.method).toBe('GET');
    req.flush(data);
  }

  it('should create', () => {
    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    flushList();
    expect(component).toBeTruthy();
  });

  it('should render the empty state when no schedules', () => {
    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    flushList();
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Noch keine Fütterungszeiten geplant');
  });

  it('should render the FAB', () => {
    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    flushList();
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('button[aria-label="Jetzt füttern"]')).toBeTruthy();
  });

  it('should render the list of schedules', () => {
    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    flushList(MOCK_SCHEDULES);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Morgens');
    expect(html.textContent).toContain('07:30');
    expect(html.textContent).toContain('40 g');
    expect(html.textContent).toContain('Abends');
  });

  it('should open the create form when "+ Neuer Plan" is clicked', () => {
    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    flushList(MOCK_SCHEDULES);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(html.querySelectorAll('button')) as HTMLButtonElement[];
    const newPlanBtn = buttons.find((b) => b.textContent?.includes('+ Neuer Plan'));
    expect(newPlanBtn).toBeTruthy();
    newPlanBtn!.click();
    fixture.detectChanges();
    expect(component.formOpen()).toBe(true);
    expect(component.editingId()).toBeNull();
  });
});
