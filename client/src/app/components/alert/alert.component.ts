import { Component, OnInit } from '@angular/core'
import { AlertService } from 'src/app/services/alert.service'
import { Alert, AlertType } from 'src/app/classes/alert'

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
  // This line is necessary to make the enum accessible from the template
  public AlertType = AlertType
  public alerts: Alert[] = []
  public maxAlerts: number = 3

  constructor(
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.alertService.getAlert().subscribe(
      (alert: Alert) => {
        if (!alert) {
          this.alerts = []
        } else {
          if (this.alerts.length === this.maxAlerts) {
            this.alerts.shift()
          }
          this.alerts.push(alert)
          setTimeout(() => this.removeAlert(alert), alert.duration)
        }
      }
    )
  }

  removeAlert(alert: Alert): void {
   this.alerts = this.alerts.filter(x => x !== alert)
  }
}
