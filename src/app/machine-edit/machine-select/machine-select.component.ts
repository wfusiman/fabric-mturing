import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {SelectionModel} from '@angular/cdk/collections';

import { AppHttpService } from '../../services/app.http.service';
import { Machine } from '../../models/machine';
import { DialogData } from './dialogData';

@Component({
  selector: 'app-machine-select',
  templateUrl: './machine-select.component.html',
  styleUrls: ['./machine-select.component.css']
})
export class MachineSelectComponent {

  machines: any;    // Maquinas para seleccionar.
  displayedColumns = ['select','id','name','description']; // Columnas a mostrar de la tabla maquinas.
  selectionMachine = new SelectionModel<Machine>( false, [] ); // Maquina seleccionada de la tabla.

  constructor( public dialogRef: MatDialogRef<MachineSelectComponent>, 
            @Inject( MAT_DIALOG_DATA )public data: DialogData,
            private httpService: AppHttpService ) { }

  ngOnInit() {
    this.retrieveMachines();
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  /* Asigna la maquina seleccionada a data */
  onAceptarClick(): void {
    if (this.selectionMachine.selected.length > 0) {
      this.data.machineSelect = this.selectionMachine.selected[0];
    }
  }

  /* Recupera el listado de maquinas disponibles */
  retrieveMachines() {
    this.httpService.getAllSimpleMachines()
      .subscribe( data => {
        this.machines = data;
      },
      error => {
        console.log( 'retrieve Machines Error: ' , error );
      });
  }

}
