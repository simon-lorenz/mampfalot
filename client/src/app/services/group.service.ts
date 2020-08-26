import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { tap, map } from 'rxjs/operators'
import { Group } from '../classes/group'
import { api } from './api'
import { GroupMember } from '../classes/groupMember'
import { groupFactory, groupMemberFactory, invitationFactory } from '../classes'
import { Invitation } from '../classes/invitation'

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(
    private http: HttpClient
  ) { }

  loadGroups(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<Group[]>(api.root + '/users/me/groups')
        .subscribe(
          (groups) => {
            localStorage.setItem('groups', JSON.stringify(groups))
            resolve()
        },
        reject
        )
    })
  }

  /**
   * Refreshes a single cached group.
   */
  refreshGroup(id): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<Group>(api.root + '/groups/' + id)
        .subscribe(
          (group) => {
            const cachedGroups = this.getGroups()
            const updatedGroups = cachedGroups.map(g => g.id === group.id ? group : g)
            localStorage.setItem('groups', JSON.stringify(updatedGroups))
            resolve()
          },
          (err) => reject(err)
        )
    })
  }

  getGroups(): Group[] {
    const groups = JSON.parse(localStorage.getItem('groups'))
    return groups.map(group => groupFactory.createNewInstance(group))
  }

  getGroup(id: number): Group {
    return this.getGroups().find(group => group.id === id)
  }

  create(group: Group): Observable<Group> {
    return this.http.post<Group>(api.root + '/groups', group)
      .pipe(
        tap(response => {
          // Push the new group to the local storage
          const groups = JSON.parse(localStorage.getItem('groups'))
          groups.push(response)
          localStorage.setItem('groups', JSON.stringify(groups))
        }),

        map(response => {
          return groupFactory.createNewInstance(response)
        })
      )
  }

  delete(group: Group): Observable<any> {
    return this.http.delete<any>(api.root + '/groups/' + group.id)
      .pipe(
        tap(() => {
          // Remove the deleted group from the local storage
          const groups = JSON.parse(localStorage.getItem('groups'))
          const result = groups.filter((elem) => {
            return elem.id !== group.id
          })
          localStorage.setItem('groups', JSON.stringify(result))
        })
      )
  }

  updateGroup(group: Group): Observable<Group> {
    return this.http.put(api.root + '/groups/' + group.id, { ...group, id: undefined })
      .pipe(
        map(response => {
          return groupFactory.createNewInstance(response)
        })
      )
  }

  getInvitations(groupId: number): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(api.root + '/groups/' + groupId + '/invitations')
      .pipe(
        map(invitations => {
          return invitations.map(i => invitationFactory.createNewInstance(i))
        })
      )
  }

  inviteUser(groupId: number, username: string): Observable<Invitation> {
    return this.http.post<Invitation>(api.root + '/groups/' + groupId + '/invitations/' + username, {})
      .pipe(
        map(invitation => {
          return invitationFactory.createNewInstance(invitation)
        })
      )
  }

  deleteInvitation(invitation: Invitation): Observable<void> {
    return this.http
      .delete<void>(api.root + '/groups/' + invitation.group.id + '/invitations/' + invitation.to.username)
  }

  deleteMember(groupId: number, member: GroupMember): Observable<any> {
    return this.http.delete(api.root + '/groups/' + groupId + '/members/' + member.username)
  }

  updateMember(groupId: number, member: GroupMember): Observable<GroupMember> {
    return this.http.put<GroupMember>(api.root + '/groups/' + groupId + '/members/' + member.username, member.config)
      .pipe(
        map(response => {
          return groupMemberFactory.createNewInstance(response)
        })
      )
  }

}
