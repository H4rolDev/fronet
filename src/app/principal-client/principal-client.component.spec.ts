import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalClientComponent } from './principal-client.component';

describe('PrincipalClientComponent', () => {
  let component: PrincipalClientComponent;
  let fixture: ComponentFixture<PrincipalClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
