import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeedNowFab } from './feed-now-fab';

describe('FeedNowFab', () => {
  let fixture: ComponentFixture<FeedNowFab>;
  let component: FeedNowFab;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedNowFab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should render the FAB', () => {
    fixture = TestBed.createComponent(FeedNowFab);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('button[aria-label="Jetzt füttern"]')).toBeTruthy();
  });

  it('should open the sheet when the FAB is clicked', () => {
    fixture = TestBed.createComponent(FeedNowFab);
    component = fixture.componentInstance;
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[aria-label="Jetzt füttern"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Portionsgrösse');
  });

  it('should default the size to medium', () => {
    fixture = TestBed.createComponent(FeedNowFab);
    component = fixture.componentInstance;
    component.show();
    expect(component.size()).toBe('medium');
  });

  it('should POST to /api/feeding/trigger?size=large and show success', () => {
    fixture = TestBed.createComponent(FeedNowFab);
    component = fixture.componentInstance;
    component.show();
    component.size.set('large');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url === '/api/feeding/trigger' && r.params.get('size') === 'large');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, size: 'large' });
    fixture.detectChanges();

    expect(component.busy()).toBe(false);
    expect(component.result()?.ok).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Gross ausgegeben.');
  });
});
