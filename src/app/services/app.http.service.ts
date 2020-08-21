import {Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const baseurl= 'http://localhost:3000/api/';

@Injectable({
    providedIn: 'root'
})
export class AppHttpService {

    constructor( private http: HttpClient ) {}

    getAllMachines() {
        return this.http.get( baseurl + 'machines' );
    }

    getAllSimpleMachines() {
        return this.http.get( baseurl + 'simpleMachines')
    }

    getMachineById( id:number ) {
        return this.http.get( baseurl + 'machines/' + id );
    }

    createMachine( machine: any ) {
        return this.http.post( baseurl + 'machines', machine );
    }

    removeMachine( id: number ) {
        return this.http.delete( baseurl +'machines/' + id  );
    }

    updateMachine( id: number, machine: any ) {
        return this.http.put( baseurl + 'machines/' + id, machine );
    }

    updateStatus( id: number, stat: boolean ) {
        return this.http.put( baseurl + 'machines/stat/' + id, { "active": stat } );
    }

}