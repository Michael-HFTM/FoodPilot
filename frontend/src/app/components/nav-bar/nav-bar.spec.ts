import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavBar } from './nav-bar';

describe('NavBar', () => {
  let fixture: ComponentFixture<NavBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render three tab links', () => {
    fixture = TestBed.createComponent(NavBar);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const links = Array.from(html.querySelectorAll('a'));
    expect(links.length).toBe(3);
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Plan', 'Status', 'Verlauf']);
  });

  it('should have the correct routerLink paths', () => {
    fixture = TestBed.createComponent(NavBar);
    const component = fixture.componentInstance;
    expect(component.tabs.map((t) => t.path)).toEqual(['/', '/status', '/verlauf']);
  });
});
