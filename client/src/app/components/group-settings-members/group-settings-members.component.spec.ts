import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { GroupSettingsMembersComponent } from './group-settings-members.component'

describe('GroupSettingsMembersComponent', () => {
  let component: GroupSettingsMembersComponent
  let fixture: ComponentFixture<GroupSettingsMembersComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupSettingsMembersComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupSettingsMembersComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
