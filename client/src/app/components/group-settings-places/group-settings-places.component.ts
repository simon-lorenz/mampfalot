import { Component, OnInit, Input } from '@angular/core'

import { PlaceService } from '../../services/place.service'

import { Place } from '../../classes/place'
import { AlertService } from 'src/app/services/alert.service'
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'

@Component({
  selector: 'app-group-settings-places',
  templateUrl: './group-settings-places.component.html',
  styleUrls: ['./group-settings-places.component.css']
})
export class GroupSettingsPlacesComponent implements OnInit {

  @Input() places: Place[]
  @Input() groupId: number

  placesForm: FormGroup

  constructor(
    private placeService: PlaceService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.placesForm = this.fb.group({
      items: this.fb.array([])
    })

    for (const place of this.places) {
      this.addItem(place)
    }
  }

  get items(): FormArray {
    return this.placesForm.get('items') as FormArray
  }

  get formHasErrors(): Boolean {
    for (const item of this.items.controls) {
      if (item.status === 'INVALID') {
        return true
      }
    }
  }

  getPlaceControls(i: number, name: string) {
    return this.items.controls[i].get(name)
  }

  addItem(place: Place): void {
    this.items.push(this.createItem(place))
  }

  createItem(place: Place): FormGroup {
    return this.fb.group({
      id: place.id,
      name: [place.name, [
        Validators.required
      ]],
      foodType: [place.foodType, [
        Validators.required
      ]]
    })
  }

  resetForm(): void {
    while ((this.placesForm.get('items') as FormArray).length !== 0) {
      (this.placesForm.get('items') as FormArray).removeAt(0)
    }

    this.placesForm.reset()

    for (const place of this.places) {
      this.addItem(place)
    }
  }

  createPlace(): void {
    const place = new Place()
    this.addItem(place)
    this.placesForm.markAsDirty()
  }

  saveChanges(): void {
    for (const control of this.items.controls) {
      if (control.pristine === false) {
        const place: Place = (control.value as Place)
        if (place.id === null) {
          this.placeService.create(this.groupId, place)
            .subscribe(
              () => {
                this.places.push(place)
              }
            )
        } else {
          this.placeService.update(this.groupId, place)
            .subscribe(
              () => {
                this.places.forEach((elem, index, arr) => {
                  if (elem.id === place.id) {
                    arr[index] = place
                  }
                })
              }
            )
        }
      }
    }
    this.placesForm.markAsPristine()
    this.alertService.success('Änderungen gespeichert!')
  }

  deletePlace(index: number): void {
    const place = (this.items.controls[index].value as Place)
    this.items.removeAt(index)
    if (place.id !== null) {
      this.placeService.delete(this.groupId, place)
        .subscribe(
          () => {
            this.places = this.places.filter(elem => elem.id !== place.id)
            this.alertService.success('Der Ort wurde gelöscht.')
          },
          () => {
            this.alertService.error('Es ist ein Fehler aufgetreten.')
          }
        )
    }
  }

  /**
   * Returns a list with all food types.
   */
  get foodTypes(): String[] {
    const foodTypes = []
    this.places.forEach(place => {
      if (place.foodType && !foodTypes.includes(place.foodType)) {
        foodTypes.push(place.foodType)
      }
    })
    return foodTypes
  }

}
