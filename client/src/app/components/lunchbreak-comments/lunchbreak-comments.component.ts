import { Component, OnInit, Input } from '@angular/core'
import { Lunchbreak } from 'src/app/classes/lunchbreak'
import { Comment } from 'src/app/classes/comment'
import { CommentService } from 'src/app/services/comment.service'
import { Group } from 'src/app/classes/group'
import { ActivatedRoute } from '@angular/router'
import { GroupMember } from 'src/app/classes/groupMember'
import { UserService } from 'src/app/services/user.service'
import * as moment from 'moment'

@Component({
  selector: 'app-lunchbreak-comments',
  templateUrl: './lunchbreak-comments.component.html',
  styleUrls: ['./lunchbreak-comments.component.css']
})
export class LunchbreakCommentsComponent implements OnInit {

  @Input() lunchbreak: Lunchbreak
  @Input() group: Group
  public newComment: Comment = new Comment()

  constructor(
    private commentService: CommentService,
    private route: ActivatedRoute,
    private user: UserService
  ) { }

  ngOnInit() {

  }

  get date() {
    return this.route.snapshot.paramMap.get('date')
  }

  get userMember(): GroupMember {
    return this.group.members.find(member => member.username === this.user.username)
  }

  formatTime(time: string): string {
    return moment(time).format('HH:mm:ss') + ' Uhr'
  }

  addComment() {
    if (this.newComment.text === '') {
      return
    }

    this.commentService.createComment(this.group.id, this.date, this.newComment)
      .subscribe(
        (comment) => {
          this.lunchbreak.comments.unshift(comment)
          this.newComment.text = ''
        }
      )
  }

}
