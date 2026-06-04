import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavTab {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
})
export class NavBar {
  readonly tabs: readonly NavTab[] = [
    { path: '/', label: 'Plan' },
    { path: '/status', label: 'Status' },
    { path: '/verlauf', label: 'Verlauf' },
  ];
}
