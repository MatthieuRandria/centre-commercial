import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientCommandeComponent } from './client-commande.component';

describe('ClientCommandeComponent', () => {
  let component: ClientCommandeComponent;
  let fixture: ComponentFixture<ClientCommandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCommandeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientCommandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
