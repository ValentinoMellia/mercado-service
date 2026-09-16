import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auctions } from './auctions';

describe('Auctions', () => {
  let component: Auctions;
  let fixture: ComponentFixture<Auctions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auctions],
    }).compileComponents();

    fixture = TestBed.createComponent(Auctions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
