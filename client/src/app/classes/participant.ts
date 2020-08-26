import { IVote } from './vote'
import { IGroupMember } from './groupMember'

export interface IParticipant {
  member: IGroupMember
  votes: IVote[]
}

export class Participant implements IParticipant {
  member: IGroupMember
  votes: IVote[]
}
