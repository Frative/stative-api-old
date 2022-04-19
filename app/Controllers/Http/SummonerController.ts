// region import
import axios from 'axios'

// cores
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// endregion

export default class SummonersController {
  public async index(ctx: HttpContextContract) {
    const { name, region } = ctx.request.qs()

    if (!name || !region) {
      return { summoner: null }
    }

    const { data } = await axios.request({
      url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT_API_KEY}`,
    })

    return { summoner: data }
  }
}
