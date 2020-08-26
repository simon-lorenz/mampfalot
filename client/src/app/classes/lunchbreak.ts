import { IParticipant } from './participant'
import { IComment } from './comment'
import { IGroupMember } from './groupMember'

export interface ILunchbreak {
  id: number
  date: string
  participants: IParticipant[]
  responseless: IGroupMember[]
  absent: IGroupMember[]
  comments: IComment[]
}

export class Lunchbreak implements ILunchbreak {
  id: number
  date: string
  participants: IParticipant[]
  responseless: IGroupMember[]
  absent: IGroupMember[]
  comments: IComment[]
}
