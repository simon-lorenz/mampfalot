import { Component, OnInit, Input } from '@angular/core'
import { Invitation } from '../../classes/invitation'
import { GroupService } from '../../services/group.service'
import { AlertService } from 'src/app/services/alert.service'

@Component({
  selector: 'app-group-settings-invitations',
  templateUrl: './group-settings-invitations.component.html',
  styleUrls: ['./group-settings-invitations.component.css']
})
export class GroupSettingsInvitationsComponent implements OnInit {

  @Input() groupId: number
  invitations: Invitation[]
  username: string

  constructor(
    private groupService: GroupService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.groupService.getInvitations(this.groupId)
      .toPromise()
      .then(invitations => this.invitations = invitations)
  }

  inviteUser(username: string) {
    this.groupService.inviteUser(this.groupId, username).toPromise()
      .then((invitation) => {
        this.invitations.push(invitation)
        this.username = ''
        this.alertService.success(`Eine Einladung wurde an ${username} gesendet.`)
      })
      .catch(err => {
        console.log(err)
        if (err.status === 404) {
          this.alertService.error('Der gesuchte User wurde nicht gefunden.')
        } else {
          this.alertService.error('Die Einladung konnte nicht gesendet werden.')
        }
      })
  }

  deleteInvitation(invitation: Invitation) {
    this.groupService.deleteInvitation(invitation)
      .subscribe(
        () => {
          this.invitations = this.invitations.filter(elem => elem !== invitation)
          this.alertService.success(`Die Einladung an ${invitation.to.username} wurde zurückgezogen.`)
        }
      )
  }

}
