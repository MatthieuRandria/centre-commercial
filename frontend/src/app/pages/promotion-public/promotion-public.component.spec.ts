import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionPublicComponent } from './promotion-public.component';

describe('PromotionPublicComponent', () => {
  let component: PromotionPublicComponent;
  let fixture: ComponentFixture<PromotionPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromotionPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromotionPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
