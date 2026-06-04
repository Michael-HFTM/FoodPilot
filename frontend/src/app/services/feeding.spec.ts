import { TestBed } from '@angular/core/testing';

import { Feeding } from './feeding';

describe('Feeding', () => {
  let service: Feeding;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feeding);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
