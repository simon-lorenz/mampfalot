import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { api } from './api'
import { Comment } from '../classes/comment'
import { commentFactory } from '../classes'

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(
    private http: HttpClient
  ) { }

  getBaseUrl(groupId: number, date: string) {
    return api.root + '/groups/' + groupId + '/lunchbreaks/' + date + '/comments'
  }

  createComment(groupId: number, date: string, comment: Comment): Observable<Comment> {
    return this.http.post(this.getBaseUrl(groupId, date), comment)
      .pipe(
        map((response) => {
          return commentFactory.createNewInstance(response)
        })
      )
  }

}
