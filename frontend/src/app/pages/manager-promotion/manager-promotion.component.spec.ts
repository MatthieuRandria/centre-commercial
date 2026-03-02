import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerPromotionComponent } from './manager-promotion.component';

describe('ManagerPromotionComponent', () => {
  let component: ManagerPromotionComponent;
  let fixture: ComponentFixture<ManagerPromotionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerPromotionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerPromotionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
