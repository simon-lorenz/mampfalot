import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { UserService } from '../../services/user.service'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'

@Component({
  selector: 'app-confirm-password-reset',
  templateUrl: './confirm-password-reset.component.html',
  styleUrls: ['./confirm-password-reset.component.css']
})
export class ConfirmPasswordResetComponent implements OnInit {

  success: string
  error: string
  username: string
  token: string
  newPassword: string
  passwordVisible: boolean = false

  resetForm: FormGroup

  constructor(
    private route: ActivatedRoute,
    private user: UserService,
    private fb: FormBuilder
  ) {
    this.resetForm = this.initForm()
  }

  get newPasswordControl() { return this.resetForm.get('newPassword')  }

  ngOnInit() {
    this.username = this.route.snapshot.queryParams['user']
    this.token = this.route.snapshot.queryParams['token']
  }

  initForm(): FormGroup {
    return this.fb.group({
      newPassword: [null, [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255)
      ]]
    })
  }

  resetPassword() {
    this.success = ''
    this.error = ''

    this.user.resetPassword(this.username, this.token, this.newPasswordControl.value)
      .subscribe(
        () => {
          this.success = 'PASSWORD_CHANGED'
        },
        (err) => {
          if (err.status === 404) {
            this.error = 'NOT_FOUND'
          } else {
            this.error = 'OTHER'
          }
        }
      )
  }

}
