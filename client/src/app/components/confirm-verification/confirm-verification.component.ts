import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { UserService } from '../../services/user.service'

@Component({
  selector: 'app-confirm-verification',
  templateUrl: './confirm-verification.component.html',
  styleUrls: ['./confirm-verification.component.css']
})
export class ConfirmVerificationComponent implements OnInit {

  username: string
  token: string

  constructor(
    private route: ActivatedRoute,
    private user: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.username = this.route.snapshot.queryParams['user']
    this.token = this.route.snapshot.queryParams['token']
    this.verify()
  }

  verify() {
    if (!(this.username && this.token)) {
      this.router.navigate(['/'], { queryParams: { activation: 'error' }})
      return
    }

    this.user.verify(this.username, this.token)
      .subscribe(
        () => {
          this.router.navigate(['/'], { queryParams: { activation: 'success' }})
        },
        () => {
          this.router.navigate(['/'], { queryParams: { activation: 'error' }})
        }
      )
  }

}
