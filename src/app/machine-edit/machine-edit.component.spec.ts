import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineEditComponent } from './machine-edit.component';

describe('MachineEditComponent', () => {
  let component: MachineEditComponent;
  let fixture: ComponentFixture<MachineEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
