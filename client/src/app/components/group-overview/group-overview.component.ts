import { Component, OnInit } from '@angular/core'
import { GroupService } from '../../services/group.service'
import { Group } from '../../classes/group'
import { Invitation } from '../../classes/invitation'
import { UserService } from '../../services/user.service'
import { Title } from '@angular/platform-browser'
import { AlertService } from 'src/app/services/alert.service'

@Component({
  selector: 'app-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.css']
})
export class GroupOverviewComponent implements OnInit {

  newGroup: Group = new Group()
  groups: Group[]
  invitations: Invitation[]

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private titleService: Title,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.newGroup.name = ''
    this.newGroup.lunchTime = '12:30:00'
    this.newGroup.voteEndingTime = '12:25:00'
    this.newGroup.pointsPerDay = 100
    this.newGroup.maxPointsPerVote = 80
    this.newGroup.minPointsPerVote = 20
    this.newGroup.utcOffset = 0

    this.groups = this.groupService.getGroups()
    this.titleService.setTitle('Gruppen - Mampfalot')

    this.userService.loadInvitations()
      .subscribe(
        (invitations) => this.invitations = invitations
      )
  }

  addGroup(): void {
    this.groupService.create(this.newGroup)
      .subscribe(
        (group) => {
          this.groups = this.groupService.getGroups()
          this.newGroup.name = ''
        },
        () => {
          this.alertService.error('Bei der Erstellung der Gruppe ist ein Fehler aufgetreten.')
        }
      )
  }

  acceptInvitation(invitation) {
    this.userService.deleteInvitation(invitation, true)
      .subscribe(
        () => {
          this.invitations = this.invitations.filter(elem => elem !== invitation)
          this.groupService
            .loadGroups()
            .then(() => this.groups = this.groupService.getGroups())
        }
      )
  }

  rejectInvitation(invitation) {
    this.userService.deleteInvitation(invitation, false)
      .subscribe(
        () => {
          this.invitations = this.invitations.filter(elem => elem !== invitation)
        }
      )
  }
}
