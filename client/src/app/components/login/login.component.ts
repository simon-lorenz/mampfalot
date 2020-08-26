import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { UserService } from '../../services/user.service'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public loginForm: FormGroup
  public passwordVisible: boolean
  public loginError: string // TODO: Use enum

  constructor(
    public user: UserService,
    private router: Router,
    private fb: FormBuilder,
    private titleService: Title
  ) {
    this.loginForm = this.fb.group({
      username: [null, [
        Validators.pattern('[a-z-_0-9]{1,255}')
      ]],
      password: [null]
    })
  }

  ngOnInit() {
    this.titleService.setTitle('Mampfalot')
  }

  get usernameControl() { return this.loginForm.get('username') }
  get passwordControl() { return this.loginForm.get('password') }

  login() {
    this.user.credentials.username = this.usernameControl.value
    this.user.credentials.password = this.passwordControl.value

    this.user.login()
    .subscribe(
      () => {
        this.router.navigate(['groups'])
      },
      (response) => {
        if (response.status === 401) {
          if (response.error.message === 'This account is not verified yet.') {
            this.loginError = 'unverified'
          } else {
            this.loginError = 'invalid'
          }
        }
      }
    )
  }
}
