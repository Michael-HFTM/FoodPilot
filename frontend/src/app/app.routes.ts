import { Routes } from '@angular/router';
import { FeedingSchedule } from './components/feeding-schedule/feeding-schedule';
import { StatusPlaceholder } from './components/status-placeholder/status-placeholder';
import { HistoryPlaceholder } from './components/history-placeholder/history-placeholder';

export const routes: Routes = [
  { path: '', component: FeedingSchedule },
  { path: 'status', component: StatusPlaceholder },
  { path: 'verlauf', component: HistoryPlaceholder },
  { path: '**', redirectTo: '' },
];
