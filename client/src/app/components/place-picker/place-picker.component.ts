import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Vote } from '../../classes/vote'
import { Group } from '../../classes/group'
import { UserService } from 'src/app/services/user.service'
import { Lunchbreak } from 'src/app/classes/lunchbreak'
import { ParticipantService } from 'src/app/services/participant.service'
import { Participation } from 'src/app/classes/participation'
import { AlertService } from 'src/app/services/alert.service'

@Component({
  selector: 'app-place-picker',
  templateUrl: './place-picker.component.html',
  styleUrls: ['./place-picker.component.css']
})
export class PlacePickerComponent implements OnInit {

  @Input() group: Group
  @Output() voted = new EventEmitter()

  public useSlider: Boolean
  public participation: Participation
  private _lunchbreak: Lunchbreak

  constructor(
    public user: UserService,
    private participationService: ParticipantService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {
    this.participation = new Participation()
    this.participation.votes = []
    this.participation.amountSpent = null
    this.participation.result = null
  }

  ngOnInit() {
    this.useSlider = this.user.useSlider
  }

  @Input()
  set lunchbreak(lunchbreak: Lunchbreak) {
    this._lunchbreak = lunchbreak

    // Initialize with current votes
    if (this.lunchbreak) {
      const participant = this.lunchbreak.participants.find(p => p.member.username === this.user.username)
      if (participant) {
        this.participation.votes = JSON.parse(JSON.stringify(participant.votes))
      }
    }
  }

  get lunchbreak(): Lunchbreak {
    return this._lunchbreak
  }

  get selectedDate(): string {
    return this.route.snapshot.paramMap.get('date')
  }

  /**
   * Calculates the point sum of this.participation.votes
   */
  get pointsSum(): number {
    let sum: number = 0
    for (const vote of this.participation.votes) {
      sum += +vote.points
    }
    return sum
  }

  // Checks for duplicate places in our votes.
  get hasDuplicatePlaces(): Boolean {
    const placeIds = this.participation.votes.map(vote => vote.place.id)
    placeIds.forEach((id, index) => {
      if (placeIds.indexOf(id) !== index) {
        return true
      }
    })

    return false
  }

  addVote(): void {
    const vote = new Vote()
    vote.place = this.group.places[0]
    vote.points = this.group.minPointsPerVote
    this.participation.votes.push(vote)
  }

  deleteVote(vote: Vote): void {
    this.participation.votes.splice(this.participation.votes.indexOf(vote), 1)
  }

  resetVotes(): void {
    const participant = this.lunchbreak.participants.find(p => p.member.username === this.user.username)
    if (participant) {
      this.participation.votes = JSON.parse(JSON.stringify(participant.votes))
    } else {
      this.participation.votes = []
    }
  }

  saveVotes() {
    this.participationService.addParticipant(this.group.id, this.selectedDate, this.participation)
    .subscribe(
        () => {
          this.voted.emit()
          this.alertService.success('Deine Stimmen wurden gespeichert.')
        },
        () => {
          this.alertService.error('Ein Fehler ist aufgetreten.')
        }
    )
  }

  /**
   * Checks if points are between the groups minPointsPerVote
   * and maxPointsPerVote limits
   * @param points
   */
  pointsValid(points: number): Boolean {
    return points >= this.group.minPointsPerVote && points <= this.group.maxPointsPerVote
  }

  allPointsValid(): Boolean {
    for (const vote of this.participation.votes) {
      if (!this.pointsValid(vote.points)) { return false }
    }
    return true
  }

  /**
   * Checks if a sum is smaller than the allowed pointsPerDay
   * @param sum
   */
  sumValid(sum: number): Boolean {
    return sum <= this.group.pointsPerDay
  }
}
