import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MachinesListComponent } from './machines-list/machines-list.component';
import { MachineViewComponent } from './machine-view/machine-view.component';
import { MachineEditComponent } from './machine-edit/machine-edit.component';
import { MachineExecComponent } from './machine-exec/machine-exec.component';

const routes: Routes = [
    { path:'',component: MachinesListComponent },
    { path:'machineView/:id', component: MachineViewComponent},
    { path:'machineEdit/:mode/:id', component: MachineEditComponent },
    { path:'machineExec/:id', component: MachineExecComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
