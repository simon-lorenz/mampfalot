import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Vote } from 'src/app/classes/vote'
import { Place } from 'src/app/classes/place'

@Component({
  selector: 'app-place-card',
  templateUrl: './place-card.component.html',
  styleUrls: ['./place-card.component.css']
})
export class PlaceCardComponent implements OnInit {

  @Input() min: number
  @Input() max: number
  @Input() places: Place[]
  @Input() vote: Vote
  @Input() useSlider: boolean

  @Output() delete: EventEmitter<void> = new EventEmitter<void>()

  constructor() { }

  ngOnInit() {

  }

  set points(value: number) {
    if (Number.isInteger(+value)) {
      this.vote.points = Number(+value)
    }
  }

  comparePlace(p1: Place, p2: Place) {
    if (p1 === null || p2 === null) {
      return false
    } else {
      return p1.name === p2.name
    }
  }

  get points(): number {
    return this.vote.points
  }

}
