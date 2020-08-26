import { IPlace } from './place'

export interface IVote {
  id: number
  points: number
  place: IPlace
}

export class Vote implements IVote {
  id: number
  points: number
  place: IPlace
}
