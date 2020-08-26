import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { LunchbreakComponent } from './lunchbreak.component'

describe('LunchbreakComponent', () => {
  let component: LunchbreakComponent
  let fixture: ComponentFixture<LunchbreakComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LunchbreakComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LunchbreakComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
