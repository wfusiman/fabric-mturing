import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineExecComponent } from './machine-exec.component';

describe('MachineExecComponent', () => {
  let component: MachineExecComponent;
  let fixture: ComponentFixture<MachineExecComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineExecComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineExecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
