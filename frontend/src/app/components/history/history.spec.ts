import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { History } from './history';
import { FeedingLog } from '../../services/history';

describe('History', () => {
  let fixture: ComponentFixture<History>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(History);
  });

  afterEach(() => http.verify());

  it('should show heading and skeleton while loading', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Verlauf');
    expect(el.querySelector('[aria-busy="true"]')).toBeTruthy();
    http.expectOne((req) => req.url.includes('/api/history/')).flush([]);
  });

  it('should render a list entry after data is returned', () => {
    fixture.detectChanges();
    const log: FeedingLog = {
      id: 1,
      schedule_id: null,
      triggered_at: '2025-01-15T08:00:00',
      size: 'medium',
      success: true,
      note: null,
    };
    http.expectOne((req) => req.url.includes('/api/history/')).flush([log]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('li')).toBeTruthy();
    expect(el.textContent).toContain('Mittel');
  });

  it('should show error banner when request fails', () => {
    fixture.detectChanges();
    http
      .expectOne((req) => req.url.includes('/api/history/'))
      .error(new ProgressEvent('error'));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Fehler');
  });
});
