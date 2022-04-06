// region import
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

// cores
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

// utilities
import { regionContinent } from 'App/Utilities'

// constants
const prisma = new PrismaClient()
// endregion

export default class SummonerMatchesController {
  public async index(ctx: HttpContextContract) {
    const { id } = ctx.request.qs()

    await prisma.$connect()
    const summoner = await prisma.summoner.findUnique({
      where: { id },
    })

    if (summoner) {
      const { matches } = summoner

      if (matches.length) {
        return { matches }
      }

      const matchesRequested = await this.fetchMatchesByPuuid(summoner.puuid, summoner.region)

      const summonerUpdated = await prisma.summoner.update({
        where: { id },
        data: {
          matches: {
            push: matchesRequested,
          },
        },
      })

      prisma.$disconnect()

      return { matches: summonerUpdated.matches }
    }

    return { matches: [] }
  }

  public async fetchMatchesByPuuid(puuid: string, region: string) {
    const { data } = await axios.request({
      url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10&api_key=${process.env.RIOT_API_KEY}`,
    })
    return data
  }
}
