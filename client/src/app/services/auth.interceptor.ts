import { Injectable } from '@angular/core'
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'
import { Observable } from 'rxjs'
import { UserService } from './user.service'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private user: UserService
  ) { }

  intercept(request: HttpRequest < any > , next: HttpHandler): Observable < HttpEvent < any >> {

    if (this.user.token && !this.user.tokenExpired()) {
      request = request.clone({
        setHeaders: {
          Authorization: 'Bearer ' + this.user.token
        }
      })
      return next.handle(request)
    } else {
      return next.handle(request)
    }
  }
}
