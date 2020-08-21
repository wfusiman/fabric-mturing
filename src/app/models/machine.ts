import { State } from './state';
import { Transition } from './transition';

export interface Machine {
    id: number; // identificacion de la maquina
    name: string;
    description: string;
    active: boolean; // habilidada/deshabilitada
    alphabet: Array<string> // lista de simbolos
    states: Array<State>;  // estados nodos 
    machines: Array<Machine>; // si es combinada, la lista de maquinas que la componen
    transitions: Array<Transition>; // transiciones entre nodos
    type: string; // de estado o combinada
}