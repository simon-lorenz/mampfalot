import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { UserService } from '../../services/user.service'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-request-password-reset',
  templateUrl: './request-password-reset.component.html',
  styleUrls: ['./request-password-reset.component.css']
})
export class RequestPasswordResetComponent implements OnInit {

  public requestPasswordResetForm: FormGroup

  public success: string
  public error: string

  constructor(
    private route: ActivatedRoute,
    private user: UserService,
    private fb: FormBuilder,
    private titleService: Title
  ) {
    this.requestPasswordResetForm = this.fb.group({
      username: [null, [
        Validators.required,
        Validators.pattern('[a-z-_0-9]{1,255}')
      ]]
    })

  }

  ngOnInit() {
    this.titleService.setTitle('Passwort vergessen - Mampfalot')
    this.usernameControl.setValue(this.route.snapshot.queryParams['user'] || null)
  }

  get usernameControl() { return this.requestPasswordResetForm.get('username') }

  requestPasswordReset() {
    this.success = ''
    this.error = ''

    this.user.requestPasswordReset(this.usernameControl.value)
      .subscribe(
        () => {
          this.success = 'EMAIL_SENT'
        },
        (err) => {
          if (err.status === 404) {
            this.error = 'NOT_FOUND'
          } else {
            this.error = `OTHER`
          }
        }
      )
  }

}
