import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { GroupSettingsPlacesComponent } from './group-settings-places.component'

describe('GroupSettingsPlacesComponents', () => {
  let component: GroupSettingsPlacesComponent
  let fixture: ComponentFixture<GroupSettingsPlacesComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupSettingsPlacesComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupSettingsPlacesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
