import { Component, OnChanges, Input, SimpleChanges } from '@angular/core'
import { Chart } from 'chart.js'
import { Participant } from '../../classes/participant'
import * as moment from 'moment'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnChanges {

  @Input() refreshRequested: boolean
  @Input() participants: Participant[]

  chart: Chart

  constructor(
    private route: ActivatedRoute
  ) {}

  get lunchbreakDateFormatted(): string {
    const date = this.route.snapshot.paramMap.get('date')
    return moment(date, 'YYYY-MM-DD').format('DD.MM.YYYY')
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }

  /**
   * Initializes this.chart
   */
  initializeChart(): void {
    if (this.chart) { return }

    const ctx = document.getElementById('votes')
    this.chart = new Chart(ctx, {
      type: 'bar',
      options: {
        title: {
            display: true,
            fontSize: 18
        },
        legend: {
          display: false
        },
        animation: {
          duration: 500
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: [{
              stacked: true,
              ticks: {
                autoSkip: false
              }
          }],
          yAxes: [{
              stacked: true
          }]
        },
      }
    })
  }

  /**
   * Updates the chart
   */
  updateChart() {
    if (!this.chart) {
      this.initializeChart()
    }

    const labels = this.getLabels()
    const datasets = this.getDatasets(labels)
    this.chart.data.labels = labels
    this.chart.data.datasets = datasets
    this.chart.options.title.text = 'Pause am ' + this.lunchbreakDateFormatted

    const votesExist = this.participants.find(p => p.votes.length > 0) !== undefined
    this.chart.options.scales.yAxes[0].display = votesExist

    this.chart.update()
    this.refreshRequested = false
  }


  /**
   * Generates the datasets for the chart
   * @param labels
   */
  getDatasets(labels: string[]) {
    const datasets = []

    for (const participant of this.participants) {
      let dataset

      // Does the user have a dataset?
      dataset = datasets.find(d => d.username === participant.member.username)

      // If the user does not already have a dataset
      // we initialize one for him
      if (!dataset) {
        dataset = {
          username: participant.member.id,
          label: participant.member.label,
          backgroundColor: participant.member.config.color,
          data: new Array(labels.length)
        }
        datasets.push(dataset)
      }

      for (const vote of participant.votes) {
        const placeIndex = labels.indexOf(vote.place.name)
        dataset.data[placeIndex] = vote.points
      }
    }
    return datasets
  }

  /**
   * Returns an string array which contains a
   * list of distinct places that got voted
   * for.
   */
  getLabels(): string[] {
    const labels = []
    this.participants.forEach(participant => {
      participant.votes.forEach(vote => {
        if (!labels.includes(vote.place.name)) {
          labels.push(vote.place.name)
        }
      })
    })
    return labels
  }
}
