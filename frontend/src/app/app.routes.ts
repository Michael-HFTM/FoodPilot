import { Routes } from '@angular/router';
import { FeedingSchedule } from './components/feeding-schedule/feeding-schedule';
import { Status } from './components/status/status';
import { History } from './components/history/history';

export const routes: Routes = [
  { path: '', component: FeedingSchedule },
  { path: 'status', component: Status },
  { path: 'verlauf', component: History },
  { path: '**', redirectTo: '' },
];
