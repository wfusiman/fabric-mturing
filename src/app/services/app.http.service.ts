import {Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const baseurl= '' //'http://localhost:8080';

@Injectable({
    providedIn: 'root'
})
export class AppHttpService {

    constructor( private http: HttpClient ) {}

    getAllMachines() {
        return this.http.get( '/api/machines' );
    }

    getAllSimpleMachines() {
        return this.http.get( baseurl + '/api/simpleMachines')
    }

    getMachineById( id:number ) {
        return this.http.get( baseurl + '/api/machines/' + id );
    }

    createMachine( machine: any ) {
        return this.http.post( baseurl + '/api/machines', machine );
    }

    removeMachine( id: number ) {
        return this.http.delete( baseurl +'/api/machines/' + id  );
    }

    updateMachine( id: number, machine: any ) {
        return this.http.put( baseurl + '/api/machines/' + id, machine );
    }

    updateStatus( id: number, stat: boolean ) {
        return this.http.put( baseurl + '/api/machines/stat/' + id, { "active": stat } );
    }

}