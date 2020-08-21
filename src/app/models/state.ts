import { Transition } from './transition';

export interface State {
    key: number,
    name: string;
    type: string; // inicio, parada, estado, maquina
    loc_x: number; // hubicacion x en el diagrama
    loc_y: number; // hubicacion y en el diagrama
}