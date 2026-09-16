import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Consumption } from './consumption';

describe('Consumption', () => {
  let component: Consumption;
  let fixture: ComponentFixture<Consumption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consumption],
    }).compileComponents();

    fixture = TestBed.createComponent(Consumption);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
