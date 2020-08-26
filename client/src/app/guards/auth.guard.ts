import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { UserService } from '../services/user.service'
import { Observable } from 'rxjs'
import { GroupSettingsComponent } from '../components/group-settings/group-settings.component'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private user: UserService,
    private router: Router
  ) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.user.isLoggedIn()) {
      this.router.navigate(['login'])
    }

    if (next.component === GroupSettingsComponent) {
      const groupId: number = +next.paramMap.get('id')
      return this.user.isGroupAdmin(groupId)
    }

    return true
  }
}
