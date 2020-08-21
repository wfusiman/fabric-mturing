import { Component, OnInit,Inject} from '@angular/core';
import { AppHttpService } from '../services/app.http.service';
import { MatSnackBar } from '@angular/material';
import { ConfirmSnackbarComponent } from '../confirm-snackbar/confirm-snackbar.component';
import { Machine } from '../models/machine';
import { MaxLengthValidator } from '@angular/forms';

@Component({
  selector: 'app-machines-list',
  templateUrl: './machines-list.component.html',
  styleUrls: ['./machines-list.component.css']
})
export class MachinesListComponent implements OnInit {

  machines: any;  // listado de maquinas

  constructor( private httpService: AppHttpService, 
               private snack: MatSnackBar ) { 
  }

  ngOnInit() {
    this.retrieveMachines();
  }

  /* Recupera las maquinas guardadas */
  retrieveMachines() {
    this.httpService.getAllMachines()
      .subscribe( data => {
        this.machines = data;
      },
      error => {
        console.log( 'retrieve Machines Error: ' , error );
      });
  }

  deleteMachine( maq : Machine ) {
    
    let confirmRef =  this.snack.openFromComponent( ConfirmSnackbarComponent, {
      data: maq,
      panelClass: ['mat-toolbar','mat-warn']
    }); 
      confirmRef.afterDismissed().subscribe( data => {
        console.log('after close data :', data.dismissedByAction);
        if (data.dismissedByAction) {
            this.httpService.removeMachine( maq.id ).subscribe( data => {
                this.snack.open( 'Maquina ' + maq.id + ':' + maq.name + ' fue eliminada','',{ 
                    duration: 5000,
                    panelClass: ['mat-toolbar','mat-primary'] });;
                this.machines = data;
            },
            error => {
                console.log( 'retrieve Machines Error: ' , error );
            });
        }
      });
  }
}

