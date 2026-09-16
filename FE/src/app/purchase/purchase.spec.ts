import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Purchase } from './purchase';

describe('Purchase', () => {
  let component: Purchase;
  let fixture: ComponentFixture<Purchase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Purchase],
    }).compileComponents();

    fixture = TestBed.createComponent(Purchase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
