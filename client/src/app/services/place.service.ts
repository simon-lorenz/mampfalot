import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { Place } from '../classes/place'
import { api } from './api'
import { placeFactory } from '../classes'

@Injectable({
  providedIn: 'root'
})
export class PlaceService {

  constructor(
    private http: HttpClient
  ) { }

  getPlacesBaseUrl(groupId: number) {
    return `${api.root}/groups/${groupId}/places`
  }

  create(groupId: number, place: Place): Observable<Place> {
    return this.http.post<Place>(this.getPlacesBaseUrl(groupId), {...place, id: undefined})
      .pipe(
        map(response => {
          return placeFactory.createNewInstance(response)
        })
      )
  }

  update(groupId: number, place: Place): Observable<Place> {
    return this.http.put<Place>(`${this.getPlacesBaseUrl(groupId)}/${place.id}`, place)
      .pipe(
        map(response => {
          return placeFactory.createNewInstance(response)
        })
      )
  }

  delete(groupId: number, place: Place): Observable<any> {
    return this.http.delete<any>(`${this.getPlacesBaseUrl(groupId)}/${place.id}`)
  }
}
