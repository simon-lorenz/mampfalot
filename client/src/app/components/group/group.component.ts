import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Group } from '../../classes/group'
import { GroupService } from '../../services/group.service'
import { Lunchbreak } from '../../classes/lunchbreak'
import { UserService } from 'src/app/services/user.service'
import { Title } from '@angular/platform-browser'
import * as moment from 'moment'

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {

  group: Group
  lunchbreak: Lunchbreak

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    public user: UserService,
    private titleService: Title
  ) { }

  ngOnInit() {
    if (moment(this.date, 'YYYY-MM-DD', true).isValid()) {
      this.getGroup()
    } else {
      this.redirectToCurrentDate()
    }
  }

  get groupId(): number {
    return Number(this.route.snapshot.paramMap.get('id'))
  }

  get date(): string {
    return this.route.snapshot.paramMap.get('date')
  }

  dateIsToday(): boolean {
    return moment().format('YYYY-MM-DD') === this.date
  }

  redirectToCurrentDate(): void {
    const currentDate = moment().format('YYYY-MM-DD')
    this.router.navigate([`/groups/${this.groupId}/${currentDate}`], { replaceUrl: true })
  }

  async getGroup() {
    await this.groupService.refreshGroup(this.groupId)
    const group = this.groupService.getGroup(this.groupId)

    if (group) {
      this.group = group
      this.titleService.setTitle(`${this.group.name} - Mampfalot`)
    } else {
      this.router.navigate(['groups'])
    }
  }

}
