import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {

    disabledNew: boolean=false;

  constructor() { 
    this.disabledNew = false;
  }

  ngOnInit() {
    
  }

  onNew() {
    this.disabledNew = true;
  }

  onList() {
      this.disabledNew = false;
  }

}
