import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusPlaceholder } from './status-placeholder';

describe('StatusPlaceholder', () => {
  it('should render the Status heading', () => {
    const fixture = TestBed.createComponent(StatusPlaceholder);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Status');
    expect(html.textContent).toContain('Demnächst verfügbar');
  });
});
