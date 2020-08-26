export enum AlertType {
  info,
  warning,
  error,
  success
}

export class Alert {

  constructor(
    public message: string,
    public type: AlertType,
    public duration: number
  ) { }

}
