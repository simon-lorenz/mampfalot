import { environment } from '../../environments/environment'

class API {
  public readonly root: string = environment.apiUrl
  public readonly auth: string = this.root + '/authenticate'
}

export let api = new API()
