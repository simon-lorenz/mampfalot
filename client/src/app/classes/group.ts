import { IGroupMember } from './groupMember'
import { ILunchbreak } from './lunchbreak'
import { IPlace } from './place'
import { IInvitation } from './invitation'

export interface IGroup {
  id: number
  name: string
  lunchTime: string
  voteEndingTime: string
  utcOffset: number
  pointsPerDay: number
  maxPointsPerVote: number
  minPointsPerVote: number
  members: IGroupMember[]
  places: IPlace[]
}

export class Group implements IGroup {
  id: number
  name: string
  lunchTime: string
  voteEndingTime: string
  utcOffset: number
  pointsPerDay: number
  maxPointsPerVote: number
  minPointsPerVote: number
  members: IGroupMember[]
  places: IPlace[]
}
