import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
import { FeedNowFab } from './components/feed-now-fab/feed-now-fab';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, FeedNowFab],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
