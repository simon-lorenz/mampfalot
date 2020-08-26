import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from './auth.service'
import { Credentials } from './../classes/credentials'
import { Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'
import { api } from './api'
import { Group } from '../classes/group'
import { User } from '../classes/user'
import { userFactory, invitationFactory } from '../classes'
import { Invitation } from '../classes/invitation'
import { GroupService } from './group.service'

@Injectable({
  providedIn: 'root'
})
export class UserService {

  credentials: Credentials = new Credentials()
  pending: boolean = false

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private http: HttpClient,
    private router: Router
  ) { }

  login(): Observable<any> {
    return new Observable((observer) => {
      // TODO: Learn how to chain observables correctly...
      this.pending = true
      this.authService
        .basic(this.credentials)
        .subscribe(
          (token: any) => {
            this.token = token
            this.getUser()
              .subscribe(
                (user: User) => {
                  localStorage.setItem('user', JSON.stringify(user))
                  this.groupService
                    .loadGroups()
                    .then(() => {
                        this.pending = false
                        observer.next()
                      }
                    )
                }
              )
          },
          (err) => {
            this.pending = false
            observer.error(err)
          }
        )
    })
  }

  getUser(): Observable<User> {
    return this.http.get<User>(api.root + '/users/me')
      .pipe(
        map(response => {
          return userFactory.createNewInstance(response)
        })
      )
  }

  updateUser(user: User, currentPassword?: string, newPassword?: string): Observable<User> {
    return this.http.put<User>(api.root + '/users/me', {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: newPassword || undefined,
      currentPassword: currentPassword || undefined
    })
      .pipe(
        map(response => {
          return userFactory.createNewInstance(response)
        }),
        tap((userInstance: User) => {
          this.username = userInstance.username
          this.email = userInstance.email
          this.firstName = userInstance.firstName
          this.lastName = userInstance.lastName
        })
      )
  }

  signup(username: string, email: string, firstName: string, lastName: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(api.root + '/users', { username, email, firstName, lastName, password })
        .subscribe(
          () => {
            resolve()
          },
          (err) => {
            reject(err)
          }
        )
    })
  }

  requestUsername(email: string): Observable<void> {
    return new Observable<void>(observer => {
      this.http.get(`${api.root}/users/${email}/forgot-username`)
        .subscribe(
          () => observer.next(),
          (err) => observer.error(err)
        )
    })
  }

  requestPasswordReset(username: string): Observable<void> {
    return new Observable<void>(observer => {
      this.http.get(`${api.root}/users/${username}/forgot-password`)
        .subscribe(
          () => observer.next(),
          (err) => observer.error(err)
        )
    })
  }

  resetPassword(username: string, token: string, newPassword: string): Observable<void> {
    return new Observable<void>(observer => {
      this.http.post(`${api.root}/users/${username}/forgot-password`, { token, newPassword })
        .subscribe(
          () => observer.next(),
          (err) => observer.error(err)
        )
    })
  }

  requestVerificationMail(username: string): Observable<void> {
    return new Observable<void>(observer => {
      this.http.get(`${api.root}/users/${username}/verify`)
        .subscribe(
          () => observer.next(),
          (err) => observer.error(err)
        )
    })
  }

  verify(username: string, token: string): Observable<void> {
    return new Observable<void>(observer => {
      this.http.post(`${api.root}/users/${username}/verify`, { token})
        .subscribe(
          () => observer.next(),
          (err) => observer.error(err)
        )
    })
  }

  get username(): string {
    return this.getUserFromStorage().username || 'To be implemented'
  }

  set username(value: string) {
    const user = this.getUserFromStorage()
    user.username = value
    localStorage.setItem('user', JSON.stringify(user))
  }

  set token(token: string) {
    localStorage.setItem('access-token', token)
  }

  get token(): string {
    return localStorage.getItem('access-token')
  }

  get id(): number {
    return this.getUserFromStorage().id
  }

  get firstName(): string {
    return this.getUserFromStorage().firstName
  }

  set firstName(firstName: string) {
    const user = this.getUserFromStorage()
    user.firstName = firstName
    localStorage.setItem('user', JSON.stringify(user))
  }

  get lastName(): string {
    return this.getUserFromStorage().lastName
  }

  set lastName(lastName: string) {
    const user = this.getUserFromStorage()
    user.lastName = lastName
    localStorage.setItem('user', JSON.stringify(user))
  }

  get email(): string {
    return this.getUserFromStorage().email
  }

  set email(email: string) {
    const user = this.getUserFromStorage()
    user.email = email
    localStorage.setItem('user', JSON.stringify(user))
  }

  get tokenExp(): number {
    const tokenDecoded = this.authService.decodeTokenPayload(this.token)
    return tokenDecoded.exp
  }

  get groups(): Group[] {
    return JSON.parse(localStorage.getItem('groups'))
  }

  get useSlider(): Boolean {
    return localStorage.getItem('useSlider') === 'true'
  }

  set useSlider(value: Boolean) {
    localStorage.setItem('useSlider', String(value))
  }

  get viewComments(): Boolean {
    return localStorage.getItem('viewComments') === 'true'
  }

  set viewComments(value: Boolean) {
    localStorage.setItem('viewComments', String(value))
  }

  getUserFromStorage(): any {
    return JSON.parse(localStorage.getItem('user'))
  }

  logout(): void {
    const useSlider = this.useSlider
    localStorage.clear()
    this.useSlider = useSlider
    this.credentials = new Credentials()
    this.router.navigate([''])
  }

  tokenExpired(): boolean {
    return this.tokenExp < Math.round(Date.now() / 1000)
  }

  isLoggedIn(): boolean {
    return this.getUserFromStorage() && !this.tokenExpired()
  }

  isGroupAdmin(groupId: number): boolean {
    const groups = JSON.parse(localStorage.getItem('groups'))
    const group = groups.find(group => group.id === groupId)
    const member = group.members.find(m => m.username === this.username)
    if (member)
      return member.config.isAdmin
    else
      return false
  }

  loadInvitations(): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(api.root + '/users/me/invitations')
      .pipe(
        map((invitations: Invitation[]) => {
          return invitations.map(invitation => invitationFactory.createNewInstance(invitation))
        })
      )
  }

  deleteInvitation(invitation: Invitation, accept: boolean): Observable<void> {
    return this.http.delete<void>(api.root + '/users/me/invitations/' + invitation.group.id, {
      params: {
        accept: String(accept)
      }
    })
  }

  findUser(username: string): Observable<User> {
    return this.http.get<User>(api.root + '/users', { params: { username }})
  }
}
