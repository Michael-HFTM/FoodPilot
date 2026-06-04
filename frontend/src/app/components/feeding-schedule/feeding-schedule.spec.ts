import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedingSchedule } from './feeding-schedule';

describe('FeedingSchedule', () => {
  let component: FeedingSchedule;
  let fixture: ComponentFixture<FeedingSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedingSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedingSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
