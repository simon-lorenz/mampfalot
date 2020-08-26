import { Component, OnInit, Input } from '@angular/core'
import { GroupMember } from '../../classes/groupMember'
import { GroupService } from '../../services/group.service'
import { AlertService } from 'src/app/services/alert.service'

@Component({
  selector: 'app-group-settings-members',
  templateUrl: './group-settings-members.component.html',
  styleUrls: ['./group-settings-members.component.css']
})
export class GroupSettingsMembersComponent implements OnInit {

  @Input() members: GroupMember[]
  @Input() groupId: number

  constructor(
    private groupService: GroupService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
  }

  deleteMember(member: GroupMember): void {
    this.groupService.deleteMember(this.groupId, member)
      .subscribe(
        () => {
          const index = this.members.indexOf(member)
          this.members.splice(index, 1)
          this.alertService.success(`${member.username} wurde aus der Gruppe entfernt.`)
        },
        () => {
          this.alertService.error('Ein Fehler ist aufgetreten.')
        }
      )
  }

  updateMemberConfig(member: GroupMember): void {
    this.groupService.updateMember(this.groupId, member).subscribe(
      () => {},
      () => {
        this.alertService.error('Es ist ein Fehler aufgetreten.')
      }
    )
  }

}
