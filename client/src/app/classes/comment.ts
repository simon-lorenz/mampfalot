import { IGroupMember } from './groupMember'

export interface IComment {
  id: number
  author: IGroupMember
  text: string
  createdAt: string
  updatedAt: string
}

export class Comment implements IComment {
  id: number
  author: IGroupMember
  text: string
  createdAt: string
  updatedAt: string
}
