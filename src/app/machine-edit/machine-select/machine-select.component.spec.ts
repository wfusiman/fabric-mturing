import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineSelectComponent } from './machine-select.component';

describe('MachineSelectComponent', () => {
  let component: MachineSelectComponent;
  let fixture: ComponentFixture<MachineSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
