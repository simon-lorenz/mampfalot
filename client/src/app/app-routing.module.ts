import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { WelcomePageComponent } from './components/welcome-page/welcome-page.component'
import { GroupOverviewComponent } from './components/group-overview/group-overview.component'
import { LoginComponent } from './components/login/login.component'
import { SignupComponent } from './components/signup/signup.component'
import { GroupComponent } from './components/group/group.component'
import { SettingsComponent } from './components/settings/settings.component'
import { GroupSettingsComponent } from './components/group-settings/group-settings.component'
import { ConfirmVerificationComponent } from './components/confirm-verification/confirm-verification.component'
import { RequestVerificationComponent } from './components/request-verification/request-verification.component'
import { RequestPasswordResetComponent } from './components/request-password-reset/request-password-reset.component'
import { ConfirmPasswordResetComponent } from './components/confirm-password-reset/confirm-password-reset.component'
import { RequestUsernameComponent } from './components/request-username/request-username.component'

import { LoginGuard } from './guards/login.guard'
import { AuthGuard } from './guards/auth.guard'
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component'
import { ImprintComponent } from './components/imprint/imprint.component'

const routes: Routes = [
  {
    path: '',
    component: WelcomePageComponent,
    canActivate: [ LoginGuard ],
    children: [
      {
        path: '',
        component: LoginComponent
      },
      {
        path: 'signup',
        component: SignupComponent
      },
      {
        path: 'request-verification',
        component: RequestVerificationComponent
      },
      {
        path: 'request-password-reset',
        component: RequestPasswordResetComponent,
      },
      {
        path: 'request-username',
        component: RequestUsernameComponent,
      },
      {
        path: 'confirm-password-reset',
        component: ConfirmPasswordResetComponent,
      },
      {
        path: 'confirm-verification',
        component: ConfirmVerificationComponent
      }
    ]
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'imprint',
    component: ImprintComponent
  },
  {
    path: 'groups',
    component: GroupOverviewComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'groups/:id',
    component: GroupComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'groups/:id/settings',
    component: GroupSettingsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'groups/:id/:date',
    component: GroupComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [ AuthGuard ]
  }
]

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
