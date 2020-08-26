import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { RequestUsernameComponent } from './request-username.component'

describe('RequestUsernameComponent', () => {
  let component: RequestUsernameComponent
  let fixture: ComponentFixture<RequestUsernameComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestUsernameComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestUsernameComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
