import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'

import { GroupService } from '../../services/group.service'
import { AlertService } from 'src/app/services/alert.service'

import { Group } from '../../classes/group'
import { groupFactory } from '../../classes'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.css']
})
export class GroupSettingsComponent implements OnInit {

  public groupSettingsForm: FormGroup

  private _group: Group

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private fb: FormBuilder,
    private titleService: Title,
    private alertService: AlertService
  ) {

    this.groupSettingsForm = this.fb.group({
      name: [null, [
        Validators.required
      ]],
      voteEndingTime: [null, [
        Validators.required
        // Validators.time
      ]],
      lunchTime: [null, [
        Validators.required
        // Validators.time
      ]],
      utcOffset: [null, [
        Validators.required
      ]],
      pointsPerDay: [null, [
        Validators.required,
        Validators.pattern('[0-9]+')
      ]],
      maxPointsPerVote: [null, [
        Validators.required,
        Validators.pattern('[0-9]+')
      ]],
      minPointsPerVote: [null, [
        Validators.required,
        Validators.pattern('[0-9]+')
      ]]
    })

   }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')
    this.getGroup(id)
  }

  get nameControl() { return this.groupSettingsForm.get('name') }
  get voteEndingTimeControl() { return this.groupSettingsForm.get('voteEndingTime') }
  get lunchTimeControl() { return this.groupSettingsForm.get('lunchTime') }
  get utcOffsetControl() { return this.groupSettingsForm.get('utcOffset') }
  get pointsPerDayControl() { return this.groupSettingsForm.get('pointsPerDay') }
  get maxPointsPerVoteControl() { return this.groupSettingsForm.get('maxPointsPerVote') }
  get minPointsPerVoteControl() { return this.groupSettingsForm.get('minPointsPerVote') }

  set group(group: Group) {
    this._group = group
    this.resetForm()
  }

  get group(): Group {
    return this._group
  }

  getGroup(id: number): void {
    this.group = this.groupService.getGroup(id)
    this.titleService.setTitle(`${this.group.name} - Mampfalot`)
  }

  deleteGroup(): void {
    this.groupService.delete(this.group)
      .subscribe(
        () => {
          this.router.navigate(['groups'])
        }
      )
  }

  onSubmit(): void {
    const group: Group = groupFactory.createNewInstance(this.groupSettingsForm.value)
    group.id = this.group.id
    this.groupService.updateGroup(group)
      .subscribe(
        (response: Group) => {
          this.group = response
          this.groupSettingsForm.markAsPristine()
          this.alertService.success('Die Änderungen wurden gespeichert!')
        },
        () => {
          this.alertService.error('Ein Fehler ist aufgetreten.')
        }
      )
  }

  /**
   * Resets the form with its initial values
   * and marks it as pristine.
   */
  resetForm(): void {
    this.nameControl.setValue(this.group.name)
    this.voteEndingTimeControl.setValue(this.group.voteEndingTime)
    this.lunchTimeControl.setValue(this.group.lunchTime)
    this.utcOffsetControl.setValue(this.group.utcOffset)
    this.pointsPerDayControl.setValue(this.group.pointsPerDay)
    this.maxPointsPerVoteControl.setValue(this.group.maxPointsPerVote)
    this.minPointsPerVoteControl.setValue(this.group.minPointsPerVote)
    this.groupSettingsForm.markAsPristine()
  }
}
