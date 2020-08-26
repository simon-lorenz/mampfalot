import { IVote } from './vote'
import { IPlace } from './place'

export interface IParticipation {
  amountSpent: number
  result: IPlace
  votes: IVote[]
}

export class Participation implements IParticipation {
  amountSpent: number
  result: IPlace
  votes: IVote[]
}
