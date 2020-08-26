import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ConfirmVerificationComponent } from './confirm-verification.component'

describe('ConfirmVerificationComponent', () => {
  let component: ConfirmVerificationComponent
  let fixture: ComponentFixture<ConfirmVerificationComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmVerificationComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmVerificationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
