import { Injectable } from '@angular/core'
import { Router, NavigationStart } from '@angular/router'
import { Alert, AlertType } from '../classes/alert'
import { Observable, Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  /**
   * Should our alerts still be displayed after
   * the user navigated?
   */
  private keepAfterRouteChange: boolean = false

  private subject: Subject<Alert>

  constructor(
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (!this.keepAfterRouteChange) {
          this.clear()
        }
      }
    })
    this.subject = new Subject<Alert>()
  }

  getAlert(): Observable<any> {
    return this.subject.asObservable()
   }

  success(message: string, duration: number = 3000): void {
    this.toast(new Alert(message, AlertType.success, duration))
  }

  error(message: string, duration: number = 3000): void {
    this.toast(new Alert(message, AlertType.error, duration))
  }

  info(message: string, duration: number = 3000): void {
    this.toast(new Alert(message, AlertType.info, duration))
  }

  warning(message: string, duration: number = 3000): void {
    this.toast(new Alert(message, AlertType.warning, duration))
  }

  toast(alert: Alert): void {
    this.subject.next(alert)
  }

  clear() {
    this.subject.next()
  }

}
