import { signal } from '@angular/core';
import { Service } from '@angular/core';

@Service()
export class Overlay {
  readonly anyOpen = signal(false);
}
