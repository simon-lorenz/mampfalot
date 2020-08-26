import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { StatePanelComponent } from './state-panel.component'

describe('StatePanelComponent', () => {
  let component: StatePanelComponent
  let fixture: ComponentFixture<StatePanelComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatePanelComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(StatePanelComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
