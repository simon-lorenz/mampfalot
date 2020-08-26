import { Component, OnInit } from '@angular/core'
import { UserService } from '../../services/user.service'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { User } from 'src/app/classes/user'
import { Title } from '@angular/platform-browser'
import { AlertService } from 'src/app/services/alert.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  public personalDataForm: FormGroup
  public passwordForm: FormGroup
  public oldPasswordVisible: boolean = false
  public newPasswordVisible: boolean = false

  constructor(
    private user: UserService,
    private fb: FormBuilder,
    private titleService: Title,
    private alertService: AlertService
  ) {

    this.personalDataForm = this.fb.group({
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
      ]]
    })

    this.passwordForm = this.fb.group({
      newPassword: [null, [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255)
      ]],
      oldPassword: [null, [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255)
      ]]
    })

   }

  ngOnInit() {
    this.titleService.setTitle(`Einstellungen - Mampfalot`)
    this.resetPersonalData()
    this.resetPassword()
  }

  get emailControl() { return this.personalDataForm.get('email') }
  get usernameControl() { return this.personalDataForm.get('username') }
  get firstNameControl() { return this.personalDataForm.get('firstName') }
  get lastNameControl() { return this.personalDataForm.get('lastName') }

  get newPasswordControl() { return this.passwordForm.get('newPassword') }
  get oldPasswordControl() { return this.passwordForm.get('oldPassword') }

  savePersonalData(): void {
    const user = new User

    user.email = this.emailControl.value
    user.username = this.usernameControl.value
    user.firstName = this.firstNameControl.value
    user.lastName = this.lastNameControl.value

    this.user.updateUser(user)
      .subscribe(
        () => {
          this.personalDataForm.markAsPristine()
          this.alertService.success('Deine Daten wurden erfolgreich gespeichert.')
        },
        () => {
          this.alertService.error('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.')
        }
      )
  }

  /**
   * Saves a new password
   */
  savePassword(): void {
    const oldPassword = this.oldPasswordControl.value
    const newPassword = this.newPasswordControl.value

    this.user.updateUser(this.user.getUserFromStorage(), oldPassword, newPassword)
      .subscribe(
        () => {
          this.passwordForm.markAsPristine()
          this.alertService.success('Dein Passwort wurde erfolgreich geändert.')
        },
        (err) => {
          if (err.status === 401) {
            this.alertService.info('Bitte überprüfe die Eingabe deines alten Passworts.')
            this.oldPasswordControl.setErrors({ invalid: true })
          } else {
            this.alertService.error('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.')
          }
        }
      )
  }

  /**
   * Resets all user input in the password section
   */
  resetPassword(): void {
    this.newPasswordControl.setValue('')
    this.oldPasswordControl.setValue('')
    this.passwordForm.markAsPristine()
  }

  /**
   * Resets replaces all user inputs in the personal data section
   * with userService data
   */
  resetPersonalData(): void {
    this.firstNameControl.setValue(this.user.firstName)
    this.lastNameControl.setValue(this.user.lastName)
    this.usernameControl.setValue(this.user.username)
    this.emailControl.setValue(this.user.email)
    this.personalDataForm.markAsPristine()
  }
}
