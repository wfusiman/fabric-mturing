import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
  selector: 'app-confirm-snackbar',
  templateUrl: './confirm-snackbar.component.html',
  styleUrls: ['./confirm-snackbar.component.css']
})
export class ConfirmSnackbarComponent implements OnInit {

  constructor( private snackbarRef: MatSnackBarRef<ConfirmSnackbarComponent>,
                @Inject(MAT_SNACK_BAR_DATA) public data: any) { 
    }

  cancelar(): void {
    this.snackbarRef.dismiss();
  }

  confirmar() {
    this.snackbarRef.dismissWithAction();
  }

  ngOnInit() {    
  }

}
