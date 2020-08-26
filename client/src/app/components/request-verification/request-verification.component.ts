import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { UserService } from '../../services/user.service'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-request-verification',
  templateUrl: './request-verification.component.html',
  styleUrls: ['./request-verification.component.css']
})
export class RequestVerificationComponent implements OnInit {

  public requestVerificationForm: FormGroup

  success: string
  error: string

  constructor(
    private route: ActivatedRoute,
    private user: UserService,
    private fb: FormBuilder,
    private titleService: Title
  ) {
    this.requestVerificationForm = this.fb.group({
      username: [null, [
        Validators.required,
        Validators.pattern('[a-z-_0-9]{1,255}')
      ]],
    })
   }

  ngOnInit() {
    this.titleService.setTitle('Aktivierung anfordern - Mampfalot')
    this.usernameControl.setValue(this.route.snapshot.queryParams['user'] || null)
  }

  get usernameControl() { return this.requestVerificationForm.get('username') }

  requestVerificationMail() {
    this.success = ''
    this.error = ''

    this.user.requestVerificationMail(this.usernameControl.value)
      .subscribe(
        () => {
          this.success = 'EMAIL_SENT'
        },
        (err) => {
          if (err.status === 404) {
            this.error = 'NOT_FOUND'
          } else if (err.error.message === 'This user is already verified.') {
            this.success = 'ALREADY_VERIFIED'
          } else {
            this.error = `OTHER`
          }
        }
      )
  }

}
