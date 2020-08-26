import { Component, OnInit } from '@angular/core'
import { UserService } from '../../services/user.service'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  navigationExpanded = false
  dialogVisible: boolean = false

  constructor(
    private user: UserService
  ) { }

  ngOnInit() {
  }

  logout(): void {
    this.user.logout()
  }

}
