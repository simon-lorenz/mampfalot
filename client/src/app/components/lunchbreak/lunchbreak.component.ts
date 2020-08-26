import { Component, OnInit, Input } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { LunchbreakService } from '../../services/lunchbreak.service'
import { Group } from '../../classes/group'
import * as moment from 'moment'
import { ParticipantService } from 'src/app/services/participant.service'
import { Lunchbreak } from 'src/app/classes/lunchbreak'
import { UserService } from 'src/app/services/user.service'

@Component({
  selector: 'app-lunchbreak',
  templateUrl: './lunchbreak.component.html',
  styleUrls: ['./lunchbreak.component.css']
})
export class LunchbreakComponent implements OnInit {

  @Input() group: Group

  public lunchbreak: Lunchbreak
  public refreshRequested: boolean = false

  constructor(
    private lunchbreakService: LunchbreakService,
    private participantService: ParticipantService,
    private user: UserService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getLunchbreak()
  }

  /**
   * Checks if a new lunchbreak can be created.
   * @returns {boolean}
   */
  get canCreateLunchbreak(): boolean {
    const voteEndingTime = moment(this.group.voteEndingTime, 'HH:mm:ss')
    return moment().isBefore(voteEndingTime)
  }

  get date(): string {
    return this.route.snapshot.paramMap.get('date')
  }

  get votingAllowed(): boolean {
    if (this.date !== moment().format('YYYY-MM-DD')) {
      return false
    }
    const voteEndingTime = moment(this.group.voteEndingTime, 'HH:mm:ss')
    const voteEndingTimeReached = moment() > voteEndingTime

    let userParticipates
    if (this.lunchbreak) {
      userParticipates = this.lunchbreak.participants.find(p => p.member.username === this.user.username) !== undefined
    } else {
      userParticipates = false
    }

    return !voteEndingTimeReached && userParticipates
  }

  get activeTab(): string {
    return this.user.viewComments ? 'comments' : 'poll'
  }

  set activeTab(value: string) {
    this.user.viewComments = value === 'comments'
  }

  onVoted(): void {
    this.getLunchbreak()
  }

  onCancelParticipation(): void {
    this.participantService.deleteParticipant(this.group.id, this.date)
      .subscribe(
        () => {
          this.getLunchbreak()
        }
      )
  }

  getLunchbreak() {
    this.lunchbreakService.getLunchbreak(this.group.id, this.date)
      .subscribe(
        (lunchbreak) => {
          this.lunchbreak = lunchbreak
          this.refreshRequested = !this.refreshRequested
        },
        (error) => {
          if (error.status === 404) {
            this.lunchbreak = undefined
          } else {
            throw error
          }
        }
      )
  }

  onStateChanged() {
    this.getLunchbreak()
  }
}
