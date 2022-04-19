// region import
import axios from 'axios'

// utilities
import { regionContinent } from 'App/Utilities'

// contracts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SummonerMatchesController {
  public async index(ctx: HttpContextContract) {
    const { puuid, region } = ctx.request.qs()

    const { data: matchIds }: { data: string[] } = await axios.request({
      url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10&api_key=${process.env.RIOT_API_KEY}`,
    })

    const matches = await Promise.all(
      matchIds.map((matchId) =>
        axios
          .request({
            url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`,
          })
          .then((res) => ({ ...res.data }))
      )
    )

    return { matches }
  }
}
