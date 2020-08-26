import { Component, OnInit, OnDestroy, Input } from '@angular/core'
import { Observable, Subscription, interval } from 'rxjs'
import { map } from 'rxjs/operators'
import * as moment from 'moment'

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.css']
})
export class CountdownComponent implements OnInit, OnDestroy {

  @Input() futureString: string
  private future: Date
  private counter$: Observable<number>
  private subscription: Subscription
  public countdown: string

  constructor() { }

  formatCountdownString(t: number): string {
      let days: number
      let hours: number
      let minutes: number
      let seconds: number

      days = Math.floor(t / 86400)
      t -= days * 86400
      hours = Math.floor(t / 3600) % 24
      t -= hours * 3600
      minutes = Math.floor(t / 60) % 60
      t -= minutes * 60
      seconds = t % 60

      const countdownString = []
      if (days > 0) { countdownString.push(days + ' Tage') }
      if (hours > 0) { countdownString.push(hours + ' Stunden') }
      if (minutes > 0) { countdownString.push(minutes + ' Minuten') }
      if (seconds > 0) { countdownString.push(seconds + ' Sekunden') }

      return countdownString.join(', ')
  }

  ngOnInit() {
      this.future = moment(this.futureString, 'HH:mm:ss').toDate()
      this.refreshCounter(Math.floor((this.future.getTime() - new Date().getTime()) / 1000))

      this.counter$ = interval(1000).pipe(
        map(() => {
          return Math.floor((this.future.getTime() - new Date().getTime()) / 1000)
        })
      )

      this.subscription = this.counter$.subscribe((x) => {
        this.refreshCounter(x)
      })
  }

  ngOnDestroy(): void {
      this.subscription.unsubscribe()
  }

  refreshCounter(x: number) {
    x > 0 ? this.countdown = this.formatCountdownString(x) : this.countdown = ''
  }
}
