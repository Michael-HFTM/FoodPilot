import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryPlaceholder } from './history-placeholder';

describe('HistoryPlaceholder', () => {
  it('should render the Verlauf heading', () => {
    const fixture = TestBed.createComponent(HistoryPlaceholder);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Verlauf');
    expect(html.textContent).toContain('Demnächst verfügbar');
  });
});
