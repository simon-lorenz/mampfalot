import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Participant } from '../classes/participant'
import { api } from './api'
import { participationFactory } from '../classes'
import { Participation } from '../classes/participation'

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  constructor(
    private http: HttpClient
  ) { }

  getParticipationUrl(groupId, date) {
    return `${api.root}/groups/${groupId}/lunchbreaks/${date}/participation`
  }

  addParticipant(groupId: number, date: string, participant: Participation): Observable<Participation> {
    return this.http.post<Participant>(this.getParticipationUrl(groupId, date), participant)
      .pipe(
        map(response => participationFactory.createNewInstance(response))
      )
  }

  deleteParticipant(groupId, date): Observable<Participant> {
    return this.http.delete<Participant>(this.getParticipationUrl(groupId, date))
  }
}
