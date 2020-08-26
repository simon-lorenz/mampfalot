import { TestBed, inject } from '@angular/core/testing'

import { LunchbreakService } from './lunchbreak.service'

describe('LunchbreakService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LunchbreakService]
    })
  })

  it('should be created', inject([LunchbreakService], (service: LunchbreakService) => {
    expect(service).toBeTruthy()
  }))
})
