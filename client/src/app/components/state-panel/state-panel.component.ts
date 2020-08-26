import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Lunchbreak } from 'src/app/classes/lunchbreak'
import { UserService } from 'src/app/services/user.service'
import { ParticipantService } from 'src/app/services/participant.service'
import { Group } from 'src/app/classes/group'
import { AbsenceService } from 'src/app/services/absence.service'
import { ActivatedRoute } from '@angular/router'
import * as moment from 'moment'

@Component({
  selector: 'app-state-panel',
  templateUrl: './state-panel.component.html',
  styleUrls: ['./state-panel.component.css']
})
export class StatePanelComponent implements OnInit {

  @Input() lunchbreak: Lunchbreak
  @Input() group: Group
  @Output() stateChanged: EventEmitter<void> = new EventEmitter<void>()

  constructor(
    private user: UserService,
    private participantService: ParticipantService,
    private absenceService: AbsenceService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

  }

  get date() {
    return this.route.snapshot.paramMap.get('date')
  }

  get state(): string {
    if (!this.lunchbreak) {
      return 'responseless'
    }

    if (this.lunchbreak.participants.find(p => p.member.username === this.user.username)) {
      return 'participating'
    }

    if (this.lunchbreak.absent.find(member => member.username === this.user.username)) {
      return 'absent'
    }

    if (this.lunchbreak.responseless.find(member => member.username === this.user.username)) {
      return 'responseless'
    }
  }

  setParticipating() {
    if (this.state === 'participating' || !this.votingAllowed) {
      return
    }

    this.participantService.addParticipant(this.group.id, this.date, {
      votes: [],
      amountSpent: null,
      result: null
    })
    .subscribe(
      () => {
        this.stateChanged.emit()
      }
    )
  }

  get votingAllowed(): boolean {
    const voteEndingTime = moment(this.group.voteEndingTime, 'HH:mm:ss')
    const voteEndingTimeReached = moment() > voteEndingTime
    return !voteEndingTimeReached && !(this.date !== moment().format('YYYY-MM-DD'))
  }

  setAbsent() {
    if (this.state === 'absent' || !this.votingAllowed) {
      return
    }

    this.absenceService.createAbsence(this.group.id, this.date)
      .subscribe(
        () => {
          this.stateChanged.emit()
        }
      )
  }

  setResponseless() {
    if (this.state === 'participating' && this.votingAllowed) {
      this.participantService.deleteParticipant(this.group.id, this.date)
      .subscribe(
        () => {
          this.stateChanged.emit()
        }
      )
    }

    if (this.state === 'absent' && this.votingAllowed) {
      this.absenceService.deleteAbsence(this.group.id, this.date)
        .subscribe(
          () => {
            this.stateChanged.emit()
          }
        )
    }
  }

}
