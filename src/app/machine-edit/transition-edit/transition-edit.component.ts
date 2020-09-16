import { Component,Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

import { settings } from '../../models/settings';
import { DialogDataTransition } from './dialogDataTransition';

@Component({
    selector: 'transition-edit',
    templateUrl: './transition-edit.component.html'
})
export class DialogNewTransitionComponent {
    
    symbol_empty = settings.SYMBOL_EMPTY;
    symbol_not = settings.SYMBOL_NOT;

    origenSelectControl = new FormControl('',Validators.required);      // control de campo seleccion origen.
    // Campo de ingreso de simbolo/s, se permite un caracter, o un caracter negado, o una lista de caracteres separados por coma.
    // Los caracteres permitidos son las letras de alfabeto (Mayusculas y minusculas), los numeros del 0 a 9, y el carcater & que representa espacio (o vacio)
    readInputControl = new FormControl( '', [Validators.required, Validators.pattern( '^[A-Za-z0-9'+this.symbol_empty+']{1}$|^'+this.symbol_not+'[A-Za-z0-9'+this.symbol_empty+']{1}$|^[A-Za-z0-9'+this.symbol_empty+'](,[A-Za-z0-9'+this.symbol_empty+'])+$' )] );      
    actionInputControl = new FormControl( '',Validators.required );     // Control de campo accion a realizar.
    writeInputControl = new FormControl('',Validators.required );       // Control de campo s+settings.SYMBOL_EMPTY+imbolo a escribir.
    destinoSelectControl = new FormControl( '',Validators.required );   // Control de campo seleccion destino.

    actionOptions: string[] = [settings.ACTION_WRITE,settings.ACTION_MOVE,settings.ACTION_SAVE];  // Opciones para seleccionar accion.
    writeSelect: boolean = false;                           // Ver/ocultar campo simbolo a escribir.
    moveSelect: boolean = false;                            // Ver/ocultar campo movimiento 
    move: string = "R";                                     // Campo movimiento.
    compuesta: boolean;

    /* Constructor: si es modo edicion carga los campos, si es nueva los campos en blanco */
    constructor( public dialogRef: MatDialogRef<DialogNewTransitionComponent>, 
                @Inject( MAT_DIALOG_DATA )public data: DialogDataTransition ) {
        if (data.mode == "edit") {
            this.readInputControl.setValue( data.symbolRead );-
            this.origenSelectControl.setValue( data.origin_select );
            this.actionInputControl.setValue( data.action );
            this.destinoSelectControl.setValue( data.destiny_select );
            if (data.action == settings.ACTION_WRITE) {
                this.writeInputControl.setValue( data.action_value );
                this.writeSelect = true;
            }
            else if (data.action == settings.ACTION_MOVE) {
                this.move = data.action_value;
                this.moveSelect = true;
            } 
        }
        this.compuesta = data.compuesta;
    }  
             
    /* Accion del boton cancelar: cierra el panel */
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /* Accion del boton aceptar: asigna los valores a data, y cierra el panel */ 
    onAceptarClick(): void {
        this.data.origin_select = this.origenSelectControl.value;
        this.data.destiny_select = this.destinoSelectControl.value;
        this.data.symbolRead = this.readInputControl.value;
        this.data.action = this.actionInputControl.value;
        if (this.actionInputControl.value === settings.ACTION_WRITE) {
            this.data.action_value = this.writeInputControl.value;
        }
        else if (this.actionInputControl.value === settings.ACTION_MOVE) {
            this.data.action_value = this.move;
        }
        else if (this.actionInputControl.value == settings.ACTION_SAVE) {
            this.data.action_value = "@";
            this.data.action = settings.ACTION_SAVE;
        }
        else { // ninguna accion
            this.data.action = settings.NO_ACTION;
            this.data.action_value = "";
        }
    }

    /* Accion de cambiar seleccion accion: muestra/oculta campos simbolo a escribir y movimiento de acuerdo a la accion seleccionada */
    changeAction(){
        if (this.actionInputControl.value == settings.ACTION_WRITE) {
            this.writeSelect = true;
            this.moveSelect = false;
        }
        else if (this.actionInputControl.value == settings.ACTION_MOVE) {
            this.writeSelect = false;
            this.moveSelect = true;
        }
        else {
            this.writeSelect = false;
            this.moveSelect = false;
        }
    }
   
    ngOnInit() {
    }
}