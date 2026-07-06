import { TestBed } from '@angular/core/testing';
import { Status } from './status';

describe('Status', () => {
  it('should render the Status heading', () => {
    const fixture = TestBed.createComponent(Status);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Status');
  });
});
