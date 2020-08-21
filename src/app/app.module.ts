import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule,MatToolbarModule,MatIconModule,MatListModule, 
         MatCardModule, MatSlideToggleModule, MatInputModule, 
         MatTableModule, MatExpansionModule, MatDialogModule, 
         MatSelectModule, MatAutocompleteModule, MatSnackBarModule,
         MatCheckboxModule,MatBottomSheet, MatBottomSheetContainer, 
         MatMenuModule, MatTooltipModule, MatGridListModule,
         MatSliderModule } from '@angular/material';
         
import { MachinesListComponent} from './machines-list/machines-list.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { MachineViewComponent } from './machine-view/machine-view.component';
import { MachineEditComponent } from './machine-edit/machine-edit.component';
import { MachineExecComponent } from './machine-exec/machine-exec.component';
import { DialogNewTransitionComponent } from './machine-edit/transition-edit/transition-edit.component';
import { FooterComponent } from './footer/footer.component';
import { MachineSelectComponent } from './machine-edit/machine-select/machine-select.component';
import { ConfirmSnackbarComponent } from './confirm-snackbar/confirm-snackbar.component';


@NgModule({
  declarations: [
    AppComponent,
    MachinesListComponent,
    TopBarComponent,
    MachineViewComponent,
    MachineEditComponent,
    MachineExecComponent,
    DialogNewTransitionComponent,
    FooterComponent,
    MachineSelectComponent,
    ConfirmSnackbarComponent,
    MatBottomSheetContainer
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatSlideToggleModule,
    MatInputModule,
    MatTableModule,
    MatExpansionModule,
    MatDialogModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatGridListModule,
    MatSliderModule
  ],
  providers: [MatBottomSheet],
  bootstrap: [AppComponent],
  entryComponents: [DialogNewTransitionComponent,MachineSelectComponent, ConfirmSnackbarComponent, MatBottomSheetContainer]
})
export class AppModule { }
