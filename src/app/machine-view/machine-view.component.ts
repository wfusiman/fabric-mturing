import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSlideToggleChange } from '@angular/material';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppHttpService } from '../services/app.http.service';
import { DiagramModel } from '../services/diagram.model';
import { settings } from '../models/settings';


@Component({
  selector: 'app-machine-view',
  templateUrl: './machine-view.component.html',
  styleUrls: ['./machine-view.component.css']
})
export class MachineViewComponent implements OnInit {

    machine: any= {};     // Maquina a visualizar.
    status: string;       // Estado de la maquina (habilitada/deshabilitada)
    statesNames: string = '';  // lista de nombres de estados en un string.

  constructor( private httpService: AppHttpService, 
               private route: ActivatedRoute,
               private _snackbar: MatSnackBar,
               private diagramModel: DiagramModel ) { 
  }

  /* Recupera una maquina a partir de su id */
  getMachine( id ) {
      this.httpService.getMachineById( id )
            .subscribe( data => {
                this.machine = data;
                this.status = this.machine.active ? 'Activada':'Desactivada'; 
                
                this.statesNames = this.machine.states.reduce( (acc, value) => {
                  if (acc.length > 0) acc = acc + ', ';
                  if (value.type == settings.TYPE_STATE_INIT)
                    return acc + value.name + '(Inicio)';
                  else if (value.type == settings.TYPE_STATE_HALT)
                    return acc + value.name + '(Parada)';
                  else 
                    return acc + value.name;
                }, '' );

                this.initDiagram();
                this.loadMachine();
            }, 
            error => {
              this._snackbar.open( error.error,'',{ 
                duration: 3000,
                panelClass: ['mat-toolbar', 'mat-warn'] });
            });
  }

  ngOnInit() {
    this.getMachine( this.route.snapshot.paramMap.get('id') );
  }

  /* Accion del ckeckbox habilitar/deshabilitar maquina */
  changeStatus( event: MatSlideToggleChange ) {
      this.status = (event.checked) ? 'Activada':'Desactivada';
      this.machine.active = event.checked;
      this.httpService.updateStatus( this.machine.id, this.machine.active ).subscribe( data => {
        console.log( 'sucesss');
      },
      error => {
        console.log( 'retrieve Machines Error: ' , error );
      });
      
  }

  /* Inicializa los diagramas visuales, diagrama de estados y diagrama de maquinas (si es compuesta) */
  initDiagram() {
    this.diagramModel.initDiagramStates( "diagramStates" );
    if (this.machine.type=='compuesta') {
      this.diagramModel.initDiagramMachines( "diagramMachines" );
    }
    else {
      document.getElementById("panel_diagramMachines").remove();
    }
  }

  /* Carga los estados y transiciones de la maquina recuperada */
  loadMachine() {    
    if (this.machine.type == 'compuesta') {
        this.machine.states.forEach( element => { // Para cada estado se agrega un nodo maquina y sus nodos estados 
          this.diagramModel.addNodeMachine( element.key, element.name, element.loc_x, element.loc_y, element.type );  // agrega el nodo maquina en el diagrama de maquinas.          
          this.diagramModel.addNodeState( element.key, element.key+':'+element.name, element.loc_x, element.loc_y, element.type, null ); // agrega el nodo maquina en el diagrama de estados.
          if (element.type == settings.TYPE_STATE_MACHINE_INIT || element.type == settings.TYPE_STATE_MACHINE) {   // Si el nodo es una maquina (no es el nodo de parada)
              let machineState = this.machine.machines.find( m => m.id == element.key ); // Recupera la maquina del arreglo de maquinas.
              machineState.states.forEach( element1 => {  // Para cada estado (excepto el de parada) de la maquina recuperada agrega los nodos al diagrama de estados.
                if (element1.type != settings.TYPE_STATE_HALT) 
                  if (element.type == settings.TYPE_STATE_MACHINE_INIT && element1.type == settings.TYPE_STATE_INIT)
                    this.diagramModel.addNodeState( element1.key, element1.name, null, null, settings.TYPE_STATE_INIT, element.key );  
                  else 
                    this.diagramModel.addNodeState( element1.key, element1.name, null, null, settings.TYPE_STATE_SIMPLE, element.key );
              });
              let statParada = machineState.states.find( st => st.type == settings.TYPE_STATE_HALT );  // Al final recupera el estado de parada.
              this.diagramModel.addNodeState( statParada.key, statParada.name, null, null, settings.TYPE_STATE_SIMPLE, element.key  ); // agrega el nodo de parada al diagrama de estados.
              machineState.transitions.forEach( item => { // Para cada transicion entre los nodos de una maquina interna, agrega los links entre nodos.
                this.diagramModel.addLinkState( item.num, Number( item.stateFrom ), Number( item.stateTo ), item.symbolRead + ((item.action!=settings.NO_ACTION) ? '/'+item.action_value: '' ) );
              });
          }
        });

        let alph = this.machine.alphabet.slice();
        alph.push( settings.SYMBOL_EMPTY ); // construye el arreglo del alfabeto y agrega el simbolo vacio.
        this.machine.transitions.forEach( item_tr => { // Por cada transicion agrega el link entre maquinas en el diagrama de maquinas, y los links entre nodos en el diagrama de estados.
           // Agrega el link de la transicion en el diagrama de maquinas
           this.diagramModel.addLinkMachine( item_tr.num, Number( item_tr.stateFrom ), Number( item_tr.stateTo ),item_tr.symbolRead );
            
           // busca la lista de simbolos de la transicion.
           let symbols;
           if (item_tr.symbolRead.includes( settings.SYMBOL_NOT ))   // Si el simbolo leido de la transicion incluye el caracter de negacion (ej. !x).
             symbols = alph.filter( a => a != item_tr.symbolRead.slice( 1,2 )); // se asigna en el arreglo todos los simbolos del alfabeto excepto el negado.
           else if (item_tr.symbolRead.includes(","))  // Si el simbolo leido de la transicion es una lista de simbolos (ej. x,y,# ). 
             symbols = item_tr.symbolRead.split(",");  // Se asigna al arreglo todos los simbolos de la lista.
           else  // En otro caso el simbolo leido de la transicion es un simbolo simple (ej. x)
             symbols = item_tr.symbolRead.split(""); // Se asigna al arreglo el simbolo solo.

           let machineFrom = this.machine.machines.find( m => m.id == Number( item_tr.stateFrom ) ); // Recupera la maquina origen.
           let stateFrom = machineFrom.states.find( s => s.type == settings.TYPE_STATE_HALT );  // Recupera el estado de parada de la maquina origen.
           let machineStateTo = this.machine.states.find( s => s.key == Number( item_tr.stateTo ));   // Recupera la maquina o estado destino.
           let stateTo; // estado destino
           if (machineStateTo.type == settings.TYPE_STATE_HALT) { // si el destino es el estado de parada 
             stateTo = machineStateTo;
             for (let index in symbols)  // genera todos los links entre el nodo de parada de la maquina origen y el nodo de parada de la maquina.
               this.diagramModel.addLinkState( Number( parseInt( item_tr.num ) * 100 + parseInt( index )), stateFrom.key, stateTo.key, 
                                                symbols[index] + ((item_tr.action != settings.NO_ACTION) ? '/'+item_tr.action_value: '' ) );               
           }
           else {  // si el destino es una maquina.
             let machineTo = this.machine.machines.find(  m => m.id == Number( item_tr.stateTo ));   // Recupera la maquina destino
             let stateInicio = machineTo.states.find( s => s.type == settings.TYPE_STATE_INIT ); // recupera el estado de inicio de la maquina destino.
             for (let index in symbols) { // Para cada simbolo de la transicion.
               //let trans = machineTo.transitions.find( t => ( Number( t.stateFrom ) == stateInicio.key && t.symbolRead == symbols[index])); // Recupera la transicion del estado de inicio con el simbolo sym.
               //stateTo = machineTo.states.find( st => st.key == Number( trans.stateTo ) );   // Recupera el estado hacia donde transicion el estado de inicio con el simbolo sym de la transicion.
               stateTo = stateInicio;
               this.diagramModel.addLinkState( Number( parseInt( item_tr.num ) * 100 + parseInt( index )), stateFrom.key, stateTo.key, 
                                                symbols[index] + ((item_tr.action != settings.NO_ACTION) ? '/'+item_tr.action_value: '' ) );
             }
           }
        });
    }
    else {
      for (let element of this.machine.states)  // agrega todos los nodos estados
          this.diagramModel.addNodeState( element.key, element.name, element.loc_x, element.loc_y, element.type, null );
      for (let tr of this.machine.transitions) // agrega todos los links de las transiciones
          this.diagramModel.addLinkState( tr.num, Number( tr.stateFrom ), Number( tr.stateTo ), 
                                          tr.symbolRead + ((tr.action != settings.NO_ACTION) ? '/' + tr.action_value: '') );
    }
    
  }

}
