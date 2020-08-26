import { BrowserModule } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NgModule } from '@angular/core'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'

import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { GroupOverviewComponent } from './components/group-overview/group-overview.component'
import { LoginComponent } from './components/login/login.component'
import { NavComponent } from './components/nav/nav.component'
import { SignupComponent } from './components/signup/signup.component'
import { AuthInterceptor } from './services/auth.interceptor'
import { GroupComponent } from './components/group/group.component'
import { LunchbreakComponent } from './components/lunchbreak/lunchbreak.component'
import { ChartComponent } from './components/chart/chart.component'
import { SettingsComponent } from './components/settings/settings.component'
import { PlacePickerComponent } from './components/place-picker/place-picker.component'
import { GroupSettingsComponent } from './components/group-settings/group-settings.component'
import { GroupSettingsMembersComponent } from './components/group-settings-members/group-settings-members.component'
import { GroupSettingsPlacesComponent } from './components/group-settings-places/group-settings-places.component'
import { ConfirmVerificationComponent } from './components/confirm-verification/confirm-verification.component'
import { RequestVerificationComponent } from './components/request-verification/request-verification.component'
import { RequestPasswordResetComponent } from './components/request-password-reset/request-password-reset.component'
import { ConfirmPasswordResetComponent } from './components/confirm-password-reset/confirm-password-reset.component'
import { WelcomePageComponent } from './components/welcome-page/welcome-page.component'
import { FooterComponent } from './components/footer/footer.component'
import { RequestUsernameComponent } from './components/request-username/request-username.component'
import { GroupSettingsInvitationsComponent } from './components/group-settings-invitations/group-settings-invitations.component'
import { CountdownComponent } from './components/countdown/countdown.component'
import { AlertComponent } from './components/alert/alert.component'
import { PlaceCardComponent } from './components/place-card/place-card.component'
import { LunchbreakCommentsComponent } from './components/lunchbreak-comments/lunchbreak-comments.component'
import { StatePanelComponent } from './components/state-panel/state-panel.component'
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component'
import { ImprintComponent } from './components/imprint/imprint.component'

@NgModule({
  declarations: [
    AppComponent,
    GroupOverviewComponent,
    LoginComponent,
    NavComponent,
    SignupComponent,
    GroupComponent,
    LunchbreakComponent,
    ChartComponent,
    SettingsComponent,
    PlacePickerComponent,
    GroupSettingsComponent,
    GroupSettingsMembersComponent,
    GroupSettingsPlacesComponent,
    ConfirmVerificationComponent,
    RequestVerificationComponent,
    RequestPasswordResetComponent,
    ConfirmPasswordResetComponent,
    WelcomePageComponent,
    FooterComponent,
    RequestUsernameComponent,
    GroupSettingsInvitationsComponent,
    CountdownComponent,
    AlertComponent,
    PlaceCardComponent,
    LunchbreakCommentsComponent,
    StatePanelComponent,
    PrivacyPolicyComponent,
    ImprintComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
