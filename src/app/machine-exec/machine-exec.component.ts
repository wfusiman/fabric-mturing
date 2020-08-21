import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppHttpService } from '../services/app.http.service';
import { DiagramModel } from '../services/diagram.model';

import { State } from '../models/state';
import { settings } from '../models/settings';

enum RunMode { COMPLETE, RUNNING, STEP , READY , TAPE_EMPTY };
enum Colors { INIT='yellow', NORMAL='white', HALT='green', ACTIVE='ORANGE', TAPE='lightgreen'}

@Component({
  selector: 'app-machine-exec',
  templateUrl: './machine-exec.component.html',
  styleUrls: ['./machine-exec.component.css']
})
export class MachineExecComponent implements OnInit {

  runMode = RunMode;
  machine: any = {}; // Maquina a ejecutar.
  diagram: any;      // Diagrama de la maquina.
  actualState: State = null; // estado actual de la maquina
  states: string;   // lista de estados separados por coma representados en un string.
  statusMachine: RunMode = RunMode.TAPE_EMPTY;

  in_ini: number; // posicion de inicio de la entrada.
  in_end: number;  // posicion de fin de la entrada.
  head: number; // posicion del cabezal de lectura de la cinta.
  result: string; // cadena resultado.

  lon_tape: number = 30;
  tape: any[] = new Array( this.lon_tape ); // cinta
  state_pos: any[] = new Array( this.lon_tape ); // indice de posiciones de la cinta.
  
  valueTape: string =""; // Entrada para la cinta.
  positionTape: number; // posicion de inicio de lectura de la cinta.

  estados: any[] = [];
  transiciones: any[] = [];

  constructor( private httpService: AppHttpService, 
               private route: ActivatedRoute, 
               private _snackbar: MatSnackBar,
               private diagramModel: DiagramModel ) { }

  /* Recupera una maquina por su id */
  getMachine( id ) {
    this.httpService.getMachineById( id )
          .subscribe( data => {
            this.machine = data;
            let array = this.machine.states.map( item => { 
              if (item.type==settings.TYPE_STATE_INIT) return item.name + '(Inicio)';
              else if (item.type==settings.TYPE_STATE_HALT) return item.name + '(Parada)';
              else return item.name; 
            });
            this.states = array.join( ", ");
            this.initDiagram();
            this.loadMachine();
          },
          error => {
            this._snackbar.open( error.error, '', {
                duration: 5000,
                panelClass: ['mat-toolbar', 'mat-warn'] });
            });
  }

  
  ngOnInit() {
    /* inicializa la cinta vacia */ 
    for (let i=0; i < this.lon_tape; i++ ){
      this.tape[i] = { simbolo:"", color: Colors.TAPE };
      this.state_pos[i] = { estado: i, color: Colors.NORMAL };
    }
    /* recupera la maquina a ejecutar */ 
    this.getMachine( this.route.snapshot.paramMap.get('id'));
  }


  cargarCinta() {
    if (this.valueTape.length == 0) return; // Si no se ingresaron caracteres no hace nada.
    let valueArray = this.valueTape.split(""); // convierte la entrada a un arreglo de caracteres
    // valida que cada caracter ingresado pertenezca al alfabeto
    for (let value of valueArray) {   
      if (value != ' ' && !this.machine.alphabet.includes( value )) {
          this._snackbar.open( 'Entrada contiene simbolos que no pertenecen al alfabeto', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['mat-toolbar', 'mat-warn','close-snackbar'] });
          return;
      }
    }
    // Valida que la posicion inicial ingresada sea una posicion valida
    if (this.positionTape  && (!Number.isInteger( Number(this.positionTape) ) || (this.positionTape < 0 || this.positionTape >= this.lon_tape))) {
        this._snackbar.open( 'Posicion de inicio invalida', 'Cerrar', {
                              duration: 3000,
                              panelClass: ['mat-toolbar', 'mat-warn','close-snackbar'] });
        return;
    }
      
    /* Se completa la cinta con los simbolos ingresados en el centro, a la derecha y a la izquierda se rellena con el simbolo vacio */
    let lon = this.valueTape.length;
    this.in_ini = -1;
    let index=0;
    for (let i=0; i < this.lon_tape; i++) {
        this.tape[i].simbolo = settings.SYMBOL_EMPTY;
        this.tape[i].color = Colors.TAPE;
        this.state_pos[i].estado = i;
        this.state_pos[i].color= Colors.NORMAL;
        if ((i >= Math.floor( (this.lon_tape - lon) / 2 )) && (index < valueArray.length)) {
          if (this.in_ini == -1) this.in_ini = i;
          this.tape[i].simbolo = (valueArray[index] == ' ') ? settings.SYMBOL_EMPTY: valueArray[index];
          index++;
        }
    }
    this.state_pos[(this.positionTape)?Number(this.positionTape):this.in_ini].color = Colors.ACTIVE;
    this.in_end = this.in_ini + lon - 1;
    this.statusMachine = RunMode.READY;
  }

  /* Realiza una lectura de la cinta en la posicion actual y ejecuta la transicion */
  track(): string {
    let previuskey=-1;
    let previusHead=-1;
    if (!this.actualState) { // Si no esta definido el estado actual carga el estado de inicio.
      this.actualState = this.estados.find( e => e.type == settings.TYPE_STATE_INIT );      
      this.head = (this.positionTape) ?Number(this.positionTape): this.in_ini;
    }
    else { // Si hay un estado actual ejecuta la transicion y la operacion sobre la cinta.
      previuskey = this.actualState.key;
      let symbol = this.tape[this.head].simbolo;
      let transicion = this.transiciones.find( tr => (tr.from == this.actualState.key && tr.read==symbol) ); // Busca la transicion para el simbolo symbol.
      if (!transicion) { // si no se encontro transicion para el simbolo, busca una transicion por cualquier otro simbolo negado (distingo de symbo) desde el mismo estado.
        transicion = this.transiciones.find( tr => (tr.from == this.actualState.key && tr.read.includes("!") && tr.read.split("")[1] != symbol ));
      }
      if (!transicion) { // Si no se encontro transicion con otro simbolo negado, busca transicion con lista de simbolos que contenga al simbolo symbol
        transicion = this.transiciones.find( tr => (tr.from == this.actualState.key && tr.read.includes(",") && tr.read.includes( symbol )));
      }
      this.actualState = this.estados.find( e => (e.key == transicion.to) );
      if (transicion.action == settings.ACTION_MOVE) { // Accion mover cabezal
        previusHead = this.head;
        this.head = (transicion.action_value == settings.MOVE_R) ? this.head+1: this.head-1;
      }
      else if (transicion.action == settings.ACTION_WRITE) { // Accion escribir en la cinta
        this.tape[this.head].simbolo = transicion.action_value;
      }
    }

    if (previuskey != -1) { // si habia un estado anterior, desactiva nodo anterior.
      this.diagramModel.activateNode( previuskey, false );  
    }
    if (previusHead != -1) { // si se movio el cabezal, actuliaza la vista de la cinta.
      this.state_pos[previusHead].color = Colors.NORMAL;
      this.tape[previusHead].color = Colors.TAPE;
      this.state_pos[previusHead].estado = previusHead;
    }
    this.state_pos[this.head].color = Colors.ACTIVE;
    this.tape[this.head].color = Colors.ACTIVE;
    this.state_pos[this.head].estado = this.actualState.name;
    this.diagramModel.activateNode( this.actualState.key, true );
    return this.actualState.type;
  }

  /* Accion ejecutar la maquina completa */
  ejecutarTodo() {
    this.resetTape();
    this.statusMachine = RunMode.RUNNING;
    //this.head = (this.positionTape) ? this.positionTape: this.in_ini;
    this.ejecutarPaso();
    for ( ; this.head < this.lon_tape-1 && this.head >= 0 && this.actualState.type != settings.TYPE_STATE_HALT; ) {
        this.ejecutarPaso();
    }
  }

  /* Accion ejecutar la maquina paso a paso */
  ejecutarPaso() {
    if (this.actualState && this.actualState.type == settings.TYPE_STATE_HALT) this.resetTape();
    this.statusMachine = RunMode.STEP;
    if (this.track() == settings.TYPE_STATE_HALT) {
        this._snackbar.open( 'Ejecucion finalizada - Estado de parada: ' + this.actualState.name , 'Cerrar',
                                                          { duration: 10000,
                                                            panelClass: ['mat-toolbar', 'mat-primary','close-snackbar'] }); 
        this.statusMachine = RunMode.COMPLETE;
    }
    if (this.head <= 0 || this.head >= this.lon_tape-1) {
        this._snackbar.open( 'Ejecucion finalizada, fin de cadena - Estado: ' + this.actualState.name, 'Cerrar',
                                                        { duration: 10000,
                                                          panelClass: ['mat-toolbar', 'mat-primary','close-snackbar','multiline-snackbar'] });
        this.statusMachine = RunMode.COMPLETE;
    }
  }

  /* Accion deterner ejecucion paso a paso y completa */
  detener() {
    this.resetTape();
    this.statusMachine = RunMode.READY;
  }


  /* Inicializa los diagramas visuales, diagrama de estados y diagrama de maquinas (si es compuesta) */
  initDiagram() {
    this.diagramModel.initDiagramStates( "diagram" );
  }

  /* Carga los estados y transiciones de la maquina recuperada */
  loadMachine() {    
    if (this.machine.type == 'compuesta') {
        this.machine.states.forEach( element => { // Para cada estado se agrega un nodo maquina y sus nodos estados 
          this.diagramModel.addNodeState( element.key, element.key+':'+element.name, element.loc_x, element.loc_y, element.type, null ); // agrega el nodo maquina en el diagrama de estados.
          if (element.type == settings.TYPE_STATE_MACHINE_INIT || element.type == settings.TYPE_STATE_MACHINE) {   // Si el nodo es una maquina (no es el nodo de parada)
              let machineState = this.machine.machines.find( m => m.id == element.key ); // Recupera la maquina del arreglo de maquinas.
              machineState.states.forEach( element1 => {  // Para cada estado (excepto el de parada) de la maquina recuperada agrega los nodos al diagrama de estados.
                if (element1.type != settings.TYPE_STATE_HALT) {
                  let type = (element.type == settings.TYPE_STATE_MACHINE_INIT && element1.type == settings.TYPE_STATE_INIT) ? settings.TYPE_STATE_INIT: settings.TYPE_STATE_SIMPLE
                  this.diagramModel.addNodeState( element1.key, element1.name, null, null, type, element.key );  
                  this.estados.push( {key: element1.key, name: element1.name, type: type } );
                }
              });
              let statParada = machineState.states.find( st => st.type == settings.TYPE_STATE_HALT );  // Al final recupera el estado de parada.
              this.diagramModel.addNodeState( statParada.key, statParada.name, null, null, settings.TYPE_STATE_SIMPLE, element.key  ); // agrega el nodo de parada al diagrama de estados.
              this.estados.push( {key: statParada.key, name: statParada.name, type: settings.TYPE_STATE_SIMPLE } );
              machineState.transitions.forEach( item => { // Para cada transicion entre los nodos de una maquina interna, agrega los links entre nodos.
                this.diagramModel.addLinkState( item.num, Number( item.stateFrom ), Number( item.stateTo ), item.symbolRead + ((item.action!=settings.NO_ACTION) ? '/'+item.action_value: '' ) );
                this.transiciones.push( {num: item.num, from: Number( item.stateFrom ), to: Number( item.stateTo ), read: item.symbolRead, action: item.action, action_value: item.action_value } );
              });
          }
          else { // Estado de parada
            this.estados.push( {key: element.key, name: element.name, type:element.type } );
          }
        });

        let alph = this.machine.alphabet.slice();
        alph.push( settings.SYMBOL_EMPTY ); // construye el arreglo del alfabeto y agrega el simbolo vacio.
        this.machine.transitions.forEach( item_tr => { // Por cada transicion agrega el link entre maquinas en el diagrama de maquinas, y los links entre nodos en el diagrama de estados.
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
             for (let index in symbols) { // genera todos los links entre el nodo de parada de la maquina origen y el nodo de parada de la maquina.
               let num = Number( parseInt( item_tr.num ) * 100 + parseInt( index ));
               this.diagramModel.addLinkState( num, stateFrom.key, stateTo.key, symbols[index] + ((item_tr.action!=settings.NO_ACTION) ? '/'+item_tr.action_value: '' ) );               
               this.transiciones.push( {num: num, from: stateFrom.key, to: stateTo.key, read: symbols[index], action: item_tr.action, action_value: item_tr.action_value } );
             }
           }
           else {  // si el destino es una maquina.
             let machineTo = this.machine.machines.find(  m => m.id == Number( item_tr.stateTo ));   // Recupera la maquina destino
             let stateInicio = machineTo.states.find( s => s.type == settings.TYPE_STATE_INIT ); // recupera el estado de inicio de la maquina destino.
             for (let index in symbols) { // Para cada simbolo de la transicion.
               //let trans = machineTo.transitions.find( t => ( Number( t.stateFrom ) == stateInicio.key && t.symbolRead == symbols[index])); // Recupera la transicion del estado de inicio con el simbolo sym.
               //stateTo = machineTo.states.find( st => st.key == Number( trans.stateTo ) );   // Recupera el estado hacia donde transicion el estado de inicio con el simbolo sym de la transicion.
               stateTo = stateInicio;
               let num = Number( parseInt( item_tr.num  ) * 100 + parseInt( index ) );
               this.diagramModel.addLinkState( num, stateFrom.key, stateTo.key, symbols[index] + ((item_tr.action!=settings.NO_ACTION) ? '/'+item_tr.action_value: '' ) );
               this.transiciones.push( { num: num, from: stateFrom.key, to: stateTo.key, read: symbols[index], action: item_tr.action, action_value: item_tr.action_value } );
             }
           }
        });
    }
    else {
      for (let element of this.machine.states)  { // agrega todos los nodos estados
          this.diagramModel.addNodeState( element.key, element.name, element.loc_x, element.loc_y, element.type, null );
          this.estados.push( {key: element.key, name: element.name, type:element.type } );
      }
      for (let tr of this.machine.transitions) { // agrega todos los links de las transiciones
          this.diagramModel.addLinkState( tr.num, Number( tr.stateFrom ), Number( tr.stateTo ), tr.symbolRead + ((tr.action!=settings.NO_ACTION) ? '/' + tr.action_value: '') );
          this.transiciones.push( {num: tr.num, from: Number(tr.stateFrom), to: Number(tr.stateTo), read: tr.symbolRead, action: tr.action, action_value: tr.action_value } );
      }
    }

  }

  /* Resetea el formato de la cinta */
  resetTape() {
    for (let i=0; i < this.lon_tape; i++) {
        this.tape[i].color = Colors.TAPE;
        this.state_pos[i].estado = i;
        this.state_pos[i].color= Colors.NORMAL;
    }
    this.state_pos[this.positionTape?Number(this.positionTape):this.in_ini].color = Colors.ACTIVE;
    if (this.actualState) {
      this.diagramModel.activateNode( this.actualState.key, false );
      this.actualState = null;
    }
  }

}
