import { Component, OnInit } from '@angular/core'
import { FormGroup, Validators, FormBuilder } from '@angular/forms'
import { UserService } from 'src/app/services/user.service'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-request-username',
  templateUrl: './request-username.component.html',
  styleUrls: ['./request-username.component.css']
})
export class RequestUsernameComponent implements OnInit {

  public success: boolean = false
  public error: boolean = false
  public requestUsernameForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private user: UserService,
    private titleService: Title
  ) {
    this.requestUsernameForm = this.fb.group({
      email: [null, [
        Validators.required,
        Validators.pattern('.+@.+\\..+')
      ]]
    })

   }

  ngOnInit() {
    this.titleService.setTitle('Benutzernamen vergessen - Mampfalot')
  }

  get emailControl() { return this.requestUsernameForm.get('email') }

  requestUsername() {
    this.success = false
    this.error = false

    this.user.requestUsername(this.emailControl.value)
      .subscribe(
        () => {
          this.success = true
        },
        () => {
          this.error = true
        }
      )
  }

}
