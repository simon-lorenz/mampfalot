import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Lunchbreak } from '../classes/lunchbreak'
import { api } from './api'
import { lunchbreakFactory } from '../classes'

@Injectable({
  providedIn: 'root'
})
export class LunchbreakService {

  constructor(
    private http: HttpClient
  ) { }

  getLunchbreak(groupId: number, date: string): Observable<Lunchbreak> {
    return this.http.get<Lunchbreak>(`${api.root}/groups/${groupId}/lunchbreaks/${date}`)
      .pipe(
        map(response => {
          return lunchbreakFactory.createNewInstance(response)
        })
      )
  }

  getLunchbreaksOfGroup(groupId: number, year: number): Observable<Lunchbreak[]> {
    return this.http
      .get<Lunchbreak[]>(api.root + '/groups/' + groupId + '/lunchbreaks',
        {
          params:
            {
              from: `${year}-01-01`,
              to: `${year}-12-31`
            }
        }
      )
      .pipe(
        map(response => {
          return response.map(lunchbreak => lunchbreakFactory.createNewInstance(lunchbreak))
        })
      )
  }

}
