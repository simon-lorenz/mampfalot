import { Component, OnInit } from '@angular/core'
import { UserService } from '../../services/user.service'
import { FormGroup, Validators, FormBuilder } from '@angular/forms'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  signupForm: FormGroup

  passwordVisible: boolean = false

  showErrorMessage: boolean = false
  showSuccessMessage: boolean = false

  signupPending: boolean

  constructor(
    private user: UserService,
    private fb: FormBuilder,
    private titleService: Title
  ) {

    this.signupForm = this.fb.group({
      email: [null, [
        Validators.required,
        Validators.pattern('.+@.+\\..+')
      ]],
      username: [null, [
        Validators.required,
        Validators.pattern('[a-z-_0-9]{1,255}')
      ]],
      firstName: [null, [
        Validators.maxLength(255)
      ]],
      lastName: [null, [
        Validators.maxLength(255)
      ]],
      password: [null, [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255)
      ]],
      policyAccepted: [false, [
        Validators.requiredTrue
      ]]
    })

  }

  ngOnInit() {
    this.titleService.setTitle('Registrierung - Mampfalot')
  }

  get emailControl() { return this.signupForm.get('email') }
  get usernameControl() { return this.signupForm.get('username') }
  get firstNameControl() { return this.signupForm.get('firstName') }
  get lastNameControl() { return this.signupForm.get('lastName') }
  get passwordControl() { return this.signupForm.get('password') }

  signup(): void {
    this.signupPending = true

    const username = this.usernameControl.value
    const email = this.emailControl.value
    const firstName = this.firstNameControl.value
    const lastName = this.lastNameControl.value
    const password = this.passwordControl.value

    this.user.signup(username, email, firstName, lastName, password)
    .then(() => {
      this.signupPending = false
      this.showSuccessMessage = true
    })
    .catch(err => {
      this.signupPending = false
      this.showErrorMessage = true
    })
  }

}
