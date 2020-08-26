import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { LunchbreakCommentsComponent } from './lunchbreak-comments.component'

describe('LunchbreakCommentsComponent', () => {
  let component: LunchbreakCommentsComponent
  let fixture: ComponentFixture<LunchbreakCommentsComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LunchbreakCommentsComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LunchbreakCommentsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
