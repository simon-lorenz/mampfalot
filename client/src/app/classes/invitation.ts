import { IUser } from './user'
import { IGroup } from './group'

export interface IInvitation {
  group: IGroup
  from: IUser
  to: IUser
}

export class Invitation implements IInvitation {
  group: IGroup
  from: IUser
  to: IUser
}
