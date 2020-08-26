export interface IUser {
  username: string
  firstName: string
  lastName: string
  email: string

  /* Calculated getter */
  label: string
  fullName: string
}

export class User implements IUser {
  username: string
  firstName: string
  lastName: string
  email: string

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
