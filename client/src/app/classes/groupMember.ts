import { IGroupMemberConfig } from './group-member-config'

export interface IGroupMember {
  id: number
  username: string
  firstName: string
  lastName: string
  config: IGroupMemberConfig

  /* Calculated getter */
  fullName: string
  label: string

}

export class GroupMember implements IGroupMember {
  id: number
  username: string
  firstName: string
  lastName: string
  config: IGroupMemberConfig

  /**
   * Returns either the fullName (if any) or the username
   */
  get label(): string {
    return this.fullName || this.username
  }

  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`
    } else if (this.firstName) {
      return this.firstName
    } else if (this.lastName) {
      return this.lastName
    }
  }
}
