import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { GroupSettingsInvitationsComponent } from './group-settings-invitations.component'

describe('GroupSettingsInvitationsComponent', () => {
  let component: GroupSettingsInvitationsComponent
  let fixture: ComponentFixture<GroupSettingsInvitationsComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupSettingsInvitationsComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupSettingsInvitationsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
