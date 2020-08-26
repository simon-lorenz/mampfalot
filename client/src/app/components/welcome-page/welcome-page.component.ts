import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.css']
})
export class WelcomePageComponent implements OnInit {

  verificationStatus: string = ''
  passwordResetStatus: string = ''
  loginStatus: string = ''

  constructor(
    public router: Router,
    public location: Location,
    public route: ActivatedRoute,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Mampfalot')
  }

}
