import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { api } from './api'
import { Credentials } from '../classes/credentials'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  /**
   * Tries to authenticate a user with basic
   * authentication.
   *
   * @param credentials
   * @returns A json web token
   */
  basic (credentials: Credentials): Observable<string> {
    const basic = btoa(unescape(encodeURIComponent(credentials.username + ':' + credentials.password)))

    const headers: HttpHeaders = new HttpHeaders({
      'Authorization': 'Basic ' + basic
    })

    return this.http.get<any>(api.auth, { headers })
      .pipe(
        map(val => val.token)
      )
  }

  decodeTokenPayload(token: string): any {
    const payload = token.split('.')[1]
    return JSON.parse(window.atob(payload))
  }
}
