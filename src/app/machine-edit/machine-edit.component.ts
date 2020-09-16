import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators, MaxLengthValidator } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import {SelectionModel} from '@angular/cdk/collections';

import { AppHttpService } from '../services/app.http.service';
import { DiagramModel } from '../services/diagram.model';

import { State } from '../models/state';
import { Transition } from '../models/transition';
import { Machine } from '../models/machine';
import { settings } from '../models/settings';

import { DialogNewTransitionComponent } from './transition-edit/transition-edit.component';
import { MachineSelectComponent } from './machine-select/machine-select.component';
import { DialogDataTransition } from './transition-edit/dialogDataTransition';
        
@Component({
  selector: 'app-machine-edit',
  templateUrl: './machine-edit.component.html',
  styleUrls: ['./machine-edit.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MachineEditComponent implements OnInit {

    mode: string; // nueva maquina o edicion de una maquina.
    machineEdit: any; // Maquina a editar si es edicion

    state_init = settings.TYPE_STATE_INIT;
    state_halt = settings.TYPE_STATE_HALT;

    // Columnas que se muestran de la tabla estados/maquinas.
    displayedColumnsState: String[] = ['select','key','name','type'];
    // Columnas que se muestran de la tabla transiciones.
    displayedColumnsTransition: string[] = ['select','numero', 'origen','simbolo_leido','accion','destino'];

    // control asociado al nombre de la maquina.
    nameInputControl = new FormControl( '',Validators.required );

    estados: State[] = [];          // lista de estados/maquina de la maquina actual
    transiciones: Transition[] = [];// lista de transiciones de la maquina.
    machines: Machine[] = [];       // lista de maquinas de la maquina.    
    esCompuesta: boolean;

    machineDesc: string;            // descripcion de la maquina
    machineAlphabet: string = "";        // cadena que contiene el alfabeto de la maquina

    selectionState = new SelectionModel<State>( false, [] );            // estado/maquina seleccionada de la tabla.
    selectionTransition = new SelectionModel<Transition>( false, [] );  // transicion seleccionada de la tabla.

    esValida: boolean = false;

    /* constructor  */
    constructor(  public dialog: MatDialog, 
                public httpService: AppHttpService,
                public diagramModel: DiagramModel,
                private _snackbar: MatSnackBar, 
                private route: Router,
                private aroute: ActivatedRoute ) { 
    }

    /* Agrega un estado al listado y un nodo correspondiente en el diagrama */
    addStateNode() {
        let state = this.addState( null, settings.TYPE_STATE_SIMPLE ); 
        this.diagramModel.addNodeState( state.key, state.name, null,null, settings.TYPE_STATE_SIMPLE ,null );  
        this.esValida = false;
    }

    /* Agrega un nuevo estado o maquina al arregle estados */
    addState( name: string , type: string ): State {
        let num = (this.estados.length == 0) ? 1: this.estados[ this.estados.length - 1].key + 1;
        let newState: State = {
            "key": num,
            "name":(name) ? name: "E" + num, 
            "type": (type) ? type: settings.TYPE_STATE_SIMPLE,
            "loc_x": 0,
            "loc_y": 0
        }
        this.estados.push( newState );
        let clone = this.estados.slice();
        this.estados = clone;

        return newState;
    }
    

    /* Elimina un estado del array estados y el nodo correspondiente en el diagrama de estados, y actualiza el alfabeto */
    delStateNode() {    
        if (this.selectionState.selected.length > 0) {
            let sel = this.selectionState.selected[0];
            if (sel.type === settings.TYPE_STATE_INIT || sel.type === settings.TYPE_STATE_HALT) {
                this._snackbar.open( 'No se puede eliminar estado de ' + sel.type,'',
                { duration: 2000 });
                return;
            }
            this.delState( sel.key );
            this.diagramModel.delNodeState( sel.key )
            this.esValida = false;
        }    
        this.updateAlphabet();
        this.selectionState.clear();
    }
     
    /* Elimina un estado o maquina del listado a partir de su key, elimina tambien las transiciones del estado */
    delState( key ) {
        this.estados = this.estados.filter( est => est.key != key );
        this.transiciones = this.transiciones.filter( tr => (Number(tr.stateFrom.split(':')[0]) != key && Number( tr.stateTo.split(':')[0] ) != key) );
    }
    
    
    /* Agrega una maquina al arreglo de estados, al arrego de maquinas, y agrega el nodo al diagramad de maquina, y los nodos de la maquina al diagrama de estados */
    addMachineNode() {
        const DialogSelectMachine = this.dialog.open( MachineSelectComponent, {
            width: '500px',
            data: { machineId: null }
        });
        
        DialogSelectMachine.afterClosed().subscribe( result => {
            if (result) {
                let maq = result.machineSelect;
                if (this.machines.length > 0 && !this.equalAlphabet( this.machines[0], maq )) {
                    this._snackbar.open( 'No se pueden combinar maquinas con distinto alfabeto','',{ 
                                        duration: 3000,
                                        panelClass: ['mat-toolbar','mat-warn'] });
                }
                else {
                    let state = this.addState( maq.name, (this.machines.length == 0) ? settings.TYPE_STATE_MACHINE_INIT : settings.TYPE_STATE_MACHINE );
                    maq.id = state.key;
                    this.machines.push( this.convertMachine( maq ) );
            
                    this.addNodeMachineAndStates( maq );
                
                    if (this.machines.length == 1) // agrega el alfabeto
                        this.machineAlphabet = this.machines[0].alphabet.join();
                }
                this.esValida = false;            }
        });
    }

    /* Agrega un nodo maquina en el diagrama de maquinas, y los nodos y transiciones de la maquina en el diagrama de estados */
    addNodeMachineAndStates( machine: Machine ) {
        let statesMaq = machine.states;
        let transitionsMaq = machine.transitions;
        
        let locxy = (this.machines.length == 1) ? 10: null;
        // agrega el nodo maquina en el diagrama de maquinas
        this.diagramModel.addNodeMachine(  machine.id, machine.name, locxy,locxy, settings.TYPE_STATE_MACHINE );

        // Agrega el nodo maquina (group) en el diagra de estados
        this.diagramModel.addNodeState( machine.id, machine.id + ':' + machine.name, locxy, locxy, settings.TYPE_STATE_MACHINE, null );

        // Agrega todos los nodos de la maquina al diagrama de estados
        statesMaq.forEach( stat => {
            if (stat.type != settings.TYPE_STATE_HALT) {
                this.diagramModel.addNodeState( stat.key, stat.name, null, null, settings.TYPE_STATE_SIMPLE, machine.id );
            }
        });
        let parada = statesMaq.find( stat => stat.type == settings.TYPE_STATE_HALT );
        this.diagramModel.addNodeState( parada.key, parada.name, null, null, settings.TYPE_STATE_SIMPLE, machine.id );

        // Agrega todas las transiciones de maquina al diagrama de estados
        transitionsMaq.forEach( tr => {
            this.diagramModel.addLinkState( tr.num, 
                                            Number( tr.stateFrom ), 
                                            Number( tr.stateTo ), 
                                            tr.symbolRead + "/" + ( (tr.action!=settings.NO_ACTION) ? tr.action_value : settings.SYMBOL_EMPTY) );
        });

    }

    /* Elimina una maquina selecciona del arrego de estados y del arreglo de maquinas.
       Luego elimina el nodo en el diagrama de maq  uinas y sus transiciones, y los nodos y transiciones de la maquina en el diagrama de estados */
    delMachineNode() {
        if (this.selectionState.selected.length > 0) {
            let sel = this.selectionState.selected[0];
            this.delState( sel.key ); // Elimina la maquina del arreglo de estados
            
            this.diagramModel.delNodeMachine( sel.key ); // Elimina el nodo y transiciones del diagrama de maquinas.
            this.diagramModel.delNodeState( sel.key );   // Elimina el nodo maquina del diagrama de estados.

            let maq = this.machines.find( m => m.id == sel.key );
            maq.states.forEach( stat => {  // Elimina todos los nodos de la maquina en el diagrama de estados.
                this.diagramModel.delNodeState( stat.key );
            });

            this.machines = this.machines.filter( m => m.id != sel.key );
            if (this.machines.length == 0)
                this.machineAlphabet = "";
            else {
                let stateInit = this.estados.find( estado => estado.key == this.machines[0].id ); // Busca la primera maquina en el listado.
                if (stateInit) 
                    stateInit.type = settings.TYPE_STATE_MACHINE_INIT; // Setea la primera maquina como maquina inicial
            }

            this.selectionState.clear();
            this.esValida = false;
        }
    }

    /* Actualiza el alfabeto en base a las transiciones definidas */
    updateAlphabet(){
        let alphabet = [];
        this.transiciones.forEach( tr => {
            let symbol = (tr.symbolRead.length == 2) ? tr.symbolRead.slice( 1,2 ) : tr.symbolRead.slice( 0,1 );
            if (symbol != settings.SYMBOL_EMPTY && symbol !=settings.SYMBOL_COPY && !alphabet.find( a => (symbol === a) ))
                alphabet.push( symbol );
            if (tr.action == settings.ACTION_WRITE && tr.action_value != settings.SYMBOL_EMPTY && tr.action_value != settings.SYMBOL_COPY && !alphabet.find( a => (tr.action_value === a)))
               alphabet.push( tr.action_value );
        });
        this.machineAlphabet = alphabet.join();
    }
    

    /* Reasigna numeros de key de los estados y num de las transiciones para una maquina */
    convertMachine( machine: Machine ): any {
        machine.states = machine.states.map( state => {
            state.key = machine.id * 100 + state.key;
            return state;
        });
        machine.transitions = machine.transitions.map( tr => {
            tr.stateFrom = (machine.id * 100 + Number( tr.stateFrom )).toString();
            tr.stateTo = (machine.id * 100 + Number( tr.stateTo )).toString();
            tr.num = (machine.id * 100 + tr.num) * (-1);
            return tr;
        });
        return machine;
    }


    /*  Compara y determina si dos maquinas tienen el mismo alfabeto, retorna true si son iguales, false si no */
    equalAlphabet( machine1: Machine, machine2: Machine ) {
        if (machine1.alphabet.length != machine2.alphabet.length)
            return false;
        let intersection = machine1.alphabet.filter( item => machine2.alphabet.includes( item ));
        if (intersection.length != machine1.alphabet.length)
            return false;
        return true;
    }

    /* Pantalla modal para definir los campos de una transicion (crear o editar) */
    dialogTransicion( mode ): MatDialogRef<DialogNewTransitionComponent,any> {
        let data: DialogDataTransition = {
            num: null,
            symbolRead: null,
            action_value: null,
            action: null,
            origin_select: null,
            destiny_select: null,
            alphabets: this.machineAlphabet.split(","),
            states_origin: [],
            states_destiny: [],
            mode: mode,
            compuesta: this.esCompuesta
        };
        if (mode == 'edit' && this.selectionTransition.selected.length > 0) {
            data.num = this.selectionTransition.selected[0].num;
            data.action = this.selectionTransition.selected[0].action;
            data.symbolRead = this.selectionTransition.selected[0].symbolRead;
            data.action_value = this.selectionTransition.selected[0].action_value;
            data.origin_select = this.selectionTransition.selected[0].stateFrom;
            data.destiny_select = this.selectionTransition.selected[0].stateTo;
        }
        for (let stat of this.estados) {
            if (stat.type !== settings.TYPE_STATE_HALT)
                data.states_origin.push(  stat.key + ' : ' + stat.name );   
            data.states_destiny.push( stat.key + ' : ' + stat.name );
        }
        
        const dialogTransition = this.dialog.open( DialogNewTransitionComponent, {
            width: '300px',
            data: data
        });
        return dialogTransition;
    }

    /* Agrega link de una transicion entre estados de una maquina a otra, en el diagrama de maquinas y el diagrama de estados  */
    addLinksTransitionMachine( id: number, from: number, to: number, read: string, action: string, action_value: string  ) {
        // Inserta link de la transicion en el diagrama de maquinas.
       this.diagramModel.addLinkMachine( id, from, to, read  );
       
        let symbols = read.split(','); // asigna a symbols la lista de simbolos de la trasicion separada por coma
    
        if (symbols[0].indexOf( settings.SYMBOL_NOT ) != -1) { // si es el complemento de un simbolo, busca todos los simbolos complementarios.
            let symbol = symbols[0].slice(1,2);
            let compsymbols = this.machineAlphabet.split(',');
            compsymbols.push( settings.SYMBOL_EMPTY );
            compsymbols = compsymbols.filter( s => s != symbol );
            symbols = compsymbols.slice();
        }
        let machineFrom = this.machines.find( maq => maq.id == from ); // Recupera la maquina origen de la transicion
        let stateFrom = machineFrom.states.find( stat => stat.type == settings.TYPE_STATE_HALT ); // Recupera el estado de parada de la maquina origen
        let machineStateTo = this.estados.find( stat => stat.key == to );    // recupera la maquina o estado destino
        let stateTo = machineStateTo; 
        for (let index in symbols) {
            if (machineStateTo.type == settings.TYPE_STATE_MACHINE || machineStateTo.type == settings.TYPE_STATE_MACHINE_INIT) { // Si el destino es una maquina, buscar el estado hacia el que transiciona el estado de inicio con el simbolo leido.
                let machineTo = this.machines.find( maq => maq.id == machineStateTo.key );
                //let origen = machineTo.states.find( stat => stat.type == settings.TYPE_STATE_INIT );
                //let transicion = machineTo.transitions.find( tr => Number( tr.stateFrom ) == origen.key && tr.symbolRead == symbols[index] );
                //stateTo = machineTo.states.find( stat => stat.key == Number( transicion.stateTo ) );
                stateTo = machineTo.states.find( stat => stat.type == settings.TYPE_STATE_INIT );
            }
            this.diagramModel.addLinkState( Number(  id * 100 + parseInt( index )), stateFrom.key, stateTo.key, symbols[index] + '/' + symbols[index] );    
        }        
    }

    /* Agrega una nueva transicion al arreglo de transiciones, y el/los nodo/s correspodientes en los diagramas de maquinas y estados  */
    addTransition( symbol: string, from: string, to: string, action: string, action_value: string ) {
        let newTransition = {
            "num": (this.transiciones.length === 0) ? 1: this.transiciones[ this.transiciones.length - 1 ].num + 1,
            "symbolRead": symbol,
            "stateFrom": from,
            "stateTo": to,
            "action": action,
            "action_value": action_value
        }
        this.transiciones.push( newTransition );
        let clone = this.transiciones.slice();
        this.transiciones = clone;

        if (!this.esCompuesta) {
            this.diagramModel.addLinkState( newTransition.num, 
                                            Number( newTransition.stateFrom.split(':')[0] ), 
                                            Number( newTransition.stateTo.split(':')[0] ), 
                                            newTransition.symbolRead +  ((newTransition.action!=settings.NO_ACTION) ? ("/" + newTransition.action_value) : '') );
            this.updateAlphabet();
        }
        else {
            this.addLinksTransitionMachine( newTransition.num, 
                                            Number( newTransition.stateFrom.split(':')[0] ), 
                                            Number( newTransition.stateTo.split(':')[0] ), 
                                            newTransition.symbolRead, 
                                            newTransition.action, 
                                            newTransition.action_value );
        }   
    }
    
    /* Devuelve true si los simbolos en el string symbolsReads (separados por coma) pertenecen al alfabet, si es falso muestra panel y devulve false */
    symbolsInAlphabet( symbolsReads: string ) {
        let symbols = (symbolsReads.indexOf( settings.SYMBOL_NOT ) != -1) ? symbolsReads.slice(1): symbolsReads;
        let msj: string = '';
        for (let symbol of symbols.split(',')) {
            if (symbol != settings.SYMBOL_EMPTY && symbol != settings.SYMBOL_COPY && !this.machineAlphabet.split(",").includes( symbol )) {
                msj += 'El simbolo ' + symbol + ' no pertenece al alfabeto \n';
            }
        }
        if (msj.length > 0) {
            this._snackbar.open( msj,'Cerrar',{ 
                duration: 3000,
                panelClass: ['mat-toolbar','mat-warn','close-snackbar'] });
            return false;
        }
        return true;
    }

    /* Actualiza los valores de una transicion y los links en el modelo */ 
    updateTransition( num: number , symbol: string, from: string, to: string, action: string, action_value: string ) {
        let tr = this.transiciones.find( element => element.num == num); // Encuentra la transicion 
        tr.symbolRead = symbol; // Actualiza los campos
        tr.action = action;
        tr.action_value = action_value;
        tr.stateFrom = from;
        tr.stateTo = to;

        if (this.esCompuesta) {
            this.diagramModel.delLinkMachine( tr.num );
            this.addLinksTransitionMachine( num, 
                                            Number( from.split(':')[0] ), 
                                            Number( to.split(':')[0] ), 
                                            symbol, 
                                            action, 
                                            action_value );
        }
        else {
            this.diagramModel.delLinkState( num );
            this.diagramModel.addLinkState( num, 
                                            Number( from.split(":")[0]),
                                            Number( to.split(":")[0]), 
                                            symbol +  ((action!=settings.NO_ACTION) ? ("/" + action_value) : ''));
            this.updateAlphabet();
        }
    }

    /* Crea una nueva transicion, nuevo link en el diagrama y actualiza el alfabeto, a partir de los datos obtenidos desde el panel modal */
    newTransition() {
        const dialog = this.dialogTransicion( "new" );
        dialog.afterClosed().subscribe( result => {
            if (result) {
                if (this.esCompuesta) { // Si es maquina compuesta
                    if (!this.symbolsInAlphabet( result.symbolRead ) || (result.action == settings.ACTION_WRITE && !this.symbolsInAlphabet( result.action_value )) )
                       return;
                    this.addTransition( result.symbolRead, result.origin_select, result.destiny_select, result.action, result.action_value );
                }
                else if (result.symbolRead.indexOf(',') != -1) { // Maquina simple, si la transicion tiene una lista de simbolos.
                    let symbols = result.symbolRead.split( ',' ); 
                    for (let symbol of symbols) // Inserta una transicion por cada simbolo de la lista
                        this.addTransition( symbol, result.origin_select, result.destiny_select, result.action, result.action_value );
                }
                else {  // Maquina simple, transicion tiene un solo simbolo 
                    this.addTransition( result.symbolRead, result.origin_select, result.destiny_select, result.action, result.action_value );
                }
                this.esValida = false;
            }
        });
    }

    /* Actualiza una transicion editada a partir del panel modal, actualiza link en el diagrama y actualiza el alfabeto */
    editTransition() {
        const dialog = this.dialogTransicion( "edit" );
        dialog.afterClosed().subscribe( result => {
            if (result) {
                if (this.esCompuesta) { // Si es maquina compuesta
                    if (!this.symbolsInAlphabet( result.symbolRead ) || (result.action == settings.ACTION_WRITE && !this.symbolsInAlphabet( result.action_value )) )
                       return;
                    this.updateTransition( result.num, result.symbolRead, result.origin_select, result.destiny_select, result.action, result.action_value );
                }
                else if (result.symbolRead.indexOf(',') != -1) { // Maquina simple, si la transicion tiene una lista de simbolos.
                    this._snackbar.open( 'El simbolo leido no puede ser una lista','Cerrar',{ 
                        duration: 3000,
                        panelClass: ['mat-toolbar','mat-warn','close-snackbar'] });
                    return;
                }
                else {  // Maquina simple, transicion tiene un solo simbolo 
                    this.updateTransition( result.num, result.symbolRead, result.origin_select, result.destiny_select, result.action, result.action_value );
                }   
                this.esValida = false;
                this.selectionTransition.clear();
            }
        })
    }

    /* Elimina una transicion de la tabla, y el link correspondiente en el diagrama */
    delTransition(){
        for (let sel of this.selectionTransition.selected) {
            this.transiciones = this.transiciones.filter( tr => (Number(tr.num != sel.num) ));
            if (this.esCompuesta) {
                this.diagramModel.delLinkMachine( sel.num );
            }
            else {
                this.diagramModel.delLinkState( sel.num );
            }
        }
        if (!this.esCompuesta)
            this.updateAlphabet();
        this.selectionTransition.clear();
        this.esValida = false;
    }
    

    ngOnInit() {
        this.mode = this.aroute.snapshot.paramMap.get('mode');
        if  (this.mode=='edit') 
            this.loadMachine( Number( this.aroute.snapshot.paramMap.get('id') ) );
        else {
            this.esCompuesta = (this.aroute.snapshot.paramMap.get('mode') == "compuesta") ? true: false;
            this.initDiagrams();
            if (this.esCompuesta) {
                // Agregar nodo Parada
                let stateParada = this.addState( "Qf", settings.TYPE_STATE_HALT);
                this.diagramModel.addNodeState( stateParada.key, stateParada.name, 900,200, settings.TYPE_STATE_HALT, null );
                this.diagramModel.addNodeMachine( stateParada.key, stateParada.name, 900,200, settings.TYPE_STATE_HALT );
            }
            else {
                // Agregar nodo de Parada
                let stateParada = this.addState( "Qf", settings.TYPE_STATE_HALT);
                this.diagramModel.addNodeState( stateParada.key, stateParada.name, 900,200, settings.TYPE_STATE_HALT, null);
                // Agregar nodo de Inicio
                let stateInicio = this.addState( "Q0", settings.TYPE_STATE_INIT );
                this.diagramModel.addNodeState( stateInicio.key, stateInicio.name , 10, 10, settings.TYPE_STATE_INIT, null );
            }
        }
    }

    loadMachine( id: number ) {
        this.httpService.getMachineById( id ).subscribe( data => {
                this.machineEdit = data;
                this.nameInputControl.setValue( this.machineEdit.name );
                this.machineDesc = this.machineEdit.description;
                this.machineAlphabet = this.machineEdit.alphabet.join();
                this.estados = this.machineEdit.states;
                this.transiciones = [];
                this.machineEdit.transitions.forEach(element => {
                    let eorigen = this.estados.find( e =>  e.key == element.stateFrom );
                    let edestino = this.estados.find( e => e.key == element.stateTo );
                    this.transiciones.push( { num: element.num, 
                                              stateFrom: eorigen.key + ' : ' + eorigen.name, 
                                              stateTo: edestino.key + ' : ' + edestino.name,
                                              symbolRead: element.symbolRead,
                                              action: element.action,
                                              action_value: element.action_value } );
                });
                this.machines = this.machineEdit.machines;
                this.esCompuesta = this.machineEdit.type == 'compuesta';
                this.initDiagrams();
                this.loadNodesTransitions();
        },
        error => {
                this._snackbar.open( error.error,'',{ 
                  duration: 5000,
                  panelClass: ['mat-toolbar', 'mat-warn'] });
        });
    }

     /* Inicializa los diagramas visuales, diagrama de estados y diagrama de maquinas (si es compuesta) */
    initDiagrams() {
        this.diagramModel.initDiagramStates( "diagramstates" );
        if (this.esCompuesta) {
        this.diagramModel.initDiagramMachines( "diagrammachines" );
        }
        else {
        document.getElementById("panelmachines").remove();
        }
    }

    loadNodesTransitions() {
        if (!this.esCompuesta) { // Si es maquina simple
            for (let element of this.machineEdit.states)  // agrega todos los nodos estados 
                  this.diagramModel.addNodeState( element.key, element.name, element.loc_x, element.loc_y, element.type, null ); 
              for (let tr of this.machineEdit.transitions) // agrega todos los links de las transiciones
                  this.diagramModel.addLinkState( tr.num, tr.stateFrom, tr.stateTo, 
                                                  tr.symbolRead + ((tr.action != settings.NO_ACTION) ? '/' + tr.action_value: '') );
        }
        else { // Maquina compuesta
            this.machineEdit.states.forEach( element => { // Para cada estado se agrega un nodo maquina y sus nodos estados 
                this.diagramModel.addNodeMachine( element.key, element.name, element.loc_x, element.loc_y, element.type );  // agrega el nodo maquina en el diagrama de maquinas.          
                this.diagramModel.addNodeState( element.key, element.key+':'+element.name, element.loc_x, element.loc_y, element.type, null ); // agrega el nodo maquina en el diagrama de estados.
                  if (element.type == settings.TYPE_STATE_MACHINE_INIT || element.type == settings.TYPE_STATE_MACHINE) {   // Si el nodo es una maquina (no es el nodo de parada)
                      let machineState = this.machineEdit.machines.find( m => m.id == element.key ); // Recupera la maquina del arreglo de maquinas.
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
                            this.diagramModel.addLinkState( item.num, Number( item.stateFrom ), Number( item.stateTo ), 
                                                            item.symbolRead + ((item.action!=settings.NO_ACTION) ? '/'+item.action_value: '' ) );
                      });
                  }
                });
        
                let alph = this.machineEdit.alphabet.slice();
                alph.push( settings.SYMBOL_EMPTY ); // construye el arreglo del alfabeto y agrega el simbolo vacio.
                this.machineEdit.transitions.forEach( item_tr => { // Por cada transicion agrega el link entre maquinas en el diagrama de maquinas, y los links entre nodos en el diagrama de estados.
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
        
                   let machineFrom = this.machineEdit.machines.find( m => m.id == Number( item_tr.stateFrom ) ); // Recupera la maquina origen.
                   let stateFrom = machineFrom.states.find( s => s.type == settings.TYPE_STATE_HALT );  // Recupera el estado de parada de la maquina origen.
                   let machineStateTo = this.machineEdit.states.find( s => s.key == Number( item_tr.stateTo ));   // Recupera la maquina o estado destino.
                   let stateTo; // estado destino
                   if (machineStateTo.type == settings.TYPE_STATE_HALT) { // si el destino es el estado de parada 
                     stateTo = machineStateTo;
                     for (let index in symbols)  // genera todos los links entre el nodo de parada de la maquina origen y el nodo de parada de la maquina.
                       this.diagramModel.addLinkState( Number( parseInt( item_tr.num ) * 100 + parseInt( index )), stateFrom.key, stateTo.key, 
                                                        symbols[index] + ((item_tr.action != settings.NO_ACTION) ? '/'+item_tr.action_value: '' ) );               
                   }
                   else {  // si el destino es una maquina.
                     let machineTo = this.machineEdit.machines.find(  m => m.id == Number( item_tr.stateTo ));   // Recupera la maquina destino
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
          
    }

    /* Valida la maquina */
    validarMaquina() {
        if (this.transiciones.length == 0) {
            this._snackbar.open( 'No se definieron transiciones','Cerrar',{ 
                duration: 3000,
                panelClass: ['mat-toolbar','mat-warn','close-snackbar'] });
        }
        else if (this.esCompuesta) 
                this.validarMaquinaCompuesta();
        else 
                this.validarMaquinaSimple();
    }

    /* Valida una maquina de estados simple */
    validarMaquinaSimple() {
        // Verifica si existen transiciones hacia todos los estados (excluyendo el estado de inicio).
        let msj = '';
        this.estados.forEach( est => {
            if (est.type != settings.TYPE_STATE_INIT) {
                let trs = this.transiciones.filter( tr => Number( tr.stateTo.split(":")[0])  == est.key );
                if (trs.length == 0) 
                    msj += 'No se definio transicion hacia el estado '  + (est.type == settings.TYPE_STATE_HALT ? 'de parada ': '') + est.key + ':' + est.name + '\n';
            }
        });

        // Verifica si todos los estados (excluyendo estado de parada) tienen transiciones para todos los simbolos
        this.estados.forEach( est => {
            if (est.type != settings.TYPE_STATE_HALT) {
                let alph =  (this.machineAlphabet.length > 0) ? this.machineAlphabet.split(","): [];
                alph.push( settings.SYMBOL_EMPTY );
                for (let a of alph) {
                    let trs = this.transiciones.filter( tr => {
                        let tr_symbol;
                        if (tr.symbolRead.slice(0,1) != settings.SYMBOL_NOT) {
                            tr_symbol = tr.symbolRead.slice( 0,1 );
                            return (tr_symbol == a && Number( tr.stateFrom.split(':')[0] ) == est.key)
                        }
                        else {
                            tr_symbol = tr.symbolRead.slice( 1,2 );
                            return (tr_symbol != a && Number( tr.stateFrom.split(':')[0] ) == est.key)
                        }
                    });                   
                    if (trs.length == 0) {
                        msj += 'Es estado ' + est.key + ':' + est.name + ' no define transicion para el simbolo ' + ((a == settings.SYMBOL_EMPTY)?'vacio ':'') + '\'' + a + '\' \n';
                    } else if (trs.length > 1) {
                        msj += 'El estado ' + est.key + ':' + est.name + ' define mas de una transicion para el mismo simbolo \'' + a + '\' \n';
                    }
                }
            }
        });

        if (msj.length > 0) {
            this._snackbar.open( msj,'Cerrar',{ 
                //duration: 5000,
                panelClass: ['mat-toolbar', 'mat-warn','close-snackbar','multiline-snackbar'] });
            this.esValida = false;
        }
        else {
            this._snackbar.open( 'Maquina valida','',{ 
                duration: 3000,
                panelClass: ['mat-toolbar', 'mat-primary'] });
            this.esValida = true;
        }     
    }

    /* Valida una maquina compuesta */
    validarMaquinaCompuesta() {
        let msj = '';
        // Verifica si existen transiciones hacia todas las maquinas (excluyendo la maquina de inicio).
        this.estados.forEach( est => {
            if (est.type != settings.TYPE_STATE_MACHINE_INIT) {
                let trs = this.transiciones.filter( tr => Number( tr.stateTo.split(":")[0])  == est.key );
                if (trs.length == 0) 
                    msj += 'No se definio transicion hacia '  + (est.type == settings.TYPE_STATE_HALT ? 'el estado de parada ': 'la maquina ') + est.key + ':' + est.name + '\n';
            }
        });

        // Verifica si todas las maquinas (excluyendo estado de parada) tienen transiciones para todos los simbolos
        let alph =  (this.machineAlphabet.length > 0) ? this.machineAlphabet.split(","): [];
        alph.push( settings.SYMBOL_EMPTY );
        this.estados.forEach( est => {
            if (est.type != settings.TYPE_STATE_HALT) {
                for (let a of alph) {
                    let count = 0;
                    this.transiciones.forEach( tr => {
                        if (Number( tr.stateFrom.split(":")[0] ) == est.key) {
                            if (tr.symbolRead.slice(0,1) == settings.SYMBOL_NOT) { // transicion con simbolo negado
                                let sym = tr.symbolRead.slice(1,2);
                                for (let s of alph)
                                    if (s != sym && s == a) count++;
                            }
                            else if(tr.symbolRead.includes(",")) {  // transicion con lista de simbolos.
                                for (let s of tr.symbolRead.split(","))
                                    if (s == a) count++;
                            }
                            else count = (tr.symbolRead == a) ? count + 1: count;
                        }
                    });                   
                    if (count == 0) {
                        msj += 'La maquina ' + est.key + ':' + est.name + ' no define transicion para el simbolo ' + ((a == settings.SYMBOL_EMPTY)?'vacio ':'') + '\'' + a + '\' \n';
                    } else if (count > 1) {
                        msj += 'La maquina ' + est.key + ':' + est.name + ' define mas de una transicion para el mismo simbolo \'' + a + '\' \n';
                    }
                }
            }
        });

        if (msj.length > 0) {
            this._snackbar.open( msj,'Cerrar',{ 
                //duration: 5000,
                panelClass: ['mat-toolbar', 'mat-warn','close-snackbar','multiline-snackbar'] });
            this.esValida = false;
        }
        else {
            this._snackbar.open( 'Maquina valida','',{ 
                duration: 3000,
                panelClass: ['mat-toolbar', 'mat-primary'] });
            this.esValida = true;
        }     
    }

    /* Crea una nueva maquina, a partir de los estados (o maquinas), transiciones, alfabeto, nombre y descripcion definidos */
    guardarMaquina() {
        if (this.esCompuesta) { 
            // Se agrega a las maquinas los datos de hubicacion del nodo en el diagrama de maquinas.
            this.estados = this.estados.map( est =>  {
                let node = this.diagramModel.getNodeMachine( est.key );
                est.loc_x = node.loc.split(" ")[0];
                est.loc_y = node.loc.split(" ")[1];
                return est;
            });
        }
        else {
            // Se agrega a los estados los datos de hubicacion del nodo en el diagrama de estados.
            this.estados = this.estados.map( est =>  {
                let node = this.diagramModel.getNodeState( est.key );
                est.loc_x = node.loc.split(" ")[0];
                est.loc_y = node.loc.split(" ")[1];
                return est;
            });
        }
        let trs = this.transiciones.map( tr => {
                let t = { num: tr.num, 
                        symbolRead: tr.symbolRead, 
                        action: tr.action, 
                        action_value: tr.action_value,  
                        stateFrom: Number( tr.stateFrom.split(":")[0] ),
                        stateTo: Number( tr.stateTo.split(":")[0] )
                }
                return t;
            });

        let machine = {
            "name": this.nameInputControl.value, // this.nameInputControl
            "description": this.machineDesc,
            "active": true,
            "alphabet": this.machineAlphabet.split(","),
            "states": this.estados,
            "machines": this.machines,
            "transitions": trs,
            "type": this.esCompuesta ? 'compuesta':'simple'
        };
        this.httpService.createMachine( machine ).subscribe(  
            response => {
                this._snackbar.open( 'Maquina agregada exitosamente','',{ 
                                    duration: 3000,
                                    panelClass: ['mat-toolbar', 'mat-primary'] });
                this.route.navigate( [''] );
            },
            error => {
                this._snackbar.open( error.error,'',{ 
                                    duration: 3000,
                                    panelClass: ['mat-toolbar', 'mat-warn'] });
            }
        );
    }

    actualizarMaquina() {
        console.log('actualizar');
        if (this.esCompuesta) { 
            // Se agrega a las maquinas los datos de hubicacion del nodo en el diagrama de maquinas.
            this.estados = this.estados.map( est =>  {
                let node = this.diagramModel.getNodeMachine( est.key );
                est.loc_x = node.loc.split(" ")[0];
                est.loc_y = node.loc.split(" ")[1];
                return est;
            });
        }
        else {
            // Se agrega a los estados los datos de hubicacion del nodo en el diagrama de estados.
            this.estados = this.estados.map( est =>  {
                let node = this.diagramModel.getNodeState( est.key );
                est.loc_x = node.loc.split(" ")[0];
                est.loc_y = node.loc.split(" ")[1];
                return est;
            });
        }
        let trs = this.transiciones.map( tr => {
                let t = { num: tr.num, 
                        symbolRead: tr.symbolRead, 
                        action: tr.action, 
                        action_value: tr.action_value,  
                        stateFrom: Number( tr.stateFrom.split(":")[0] ),
                        stateTo: Number( tr.stateTo.split(":")[0] )
                }
                return t;
            });
        this.machineEdit.name =  this.nameInputControl.value;
        this.machineEdit.description= this.machineDesc;
        this.machineEdit.alphabet = this.machineAlphabet.split(",");
        this.machineEdit.states = this.estados;
        this.machineEdit.machines = this.machines;
        this.machineEdit.transitions = trs,
        this.httpService.updateMachine( this.machineEdit.id, this.machineEdit ).subscribe(  
            response => {
                this._snackbar.open( 'Maquina ' + this.machineEdit.id + ' actualizada','',{ 
                                    duration: 3000,
                                    panelClass: ['mat-toolbar', 'mat-primary'] });
                this.route.navigate( [''] );
            },
            error => {
                this._snackbar.open( error.error,'',{ 
                                    duration: 3000,
                                    panelClass: ['mat-toolbar', 'mat-warn'] });
            }
        );
    }

}
