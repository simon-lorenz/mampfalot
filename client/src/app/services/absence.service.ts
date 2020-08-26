import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { api } from './api'

@Injectable({
  providedIn: 'root'
})
export class AbsenceService {

  constructor(
    private http: HttpClient
  ) { }

  getAbsenceUrl(groupId, date) {
    return api.root + '/groups/' + groupId + '/lunchbreaks/' + date + '/absence'
  }

  deleteAbsence(groupId, date): Observable<void> {
    return this.http.delete<void>(this.getAbsenceUrl(groupId, date))
  }

  createAbsence(groupId, date): Observable<void> {
    return this.http.post<void>(this.getAbsenceUrl(groupId, date), {})
  }

}
