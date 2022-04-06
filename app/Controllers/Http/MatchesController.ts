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

export default class MatchesController {
  public async index(ctx: HttpContextContract) {
    const { ids, region } = ctx.request.qs()
    if (ids && region) {
      const matchesIds: string[] = ids.split(',')

      prisma.$connect()

      const matchesFound = await this.findMatchesByIds(matchesIds)

      if (matchesFound.length === matchesIds.length) {
        return { matches: matchesFound }
      }

      const matchesRequested = await Promise.all(
        matchesIds.map((matchId) =>
          this.fetchMatchesById(matchId, region).then((match) => ({ id: matchId, ...match }))
        )
      )

      await prisma.match.createMany({
        data: matchesRequested,
      })

      const matchesStored = await this.findMatchesByIds(matchesIds)

      prisma.$disconnect()

      return { matches: matchesStored }
    }

    return { matches: [] }
  }

  public async fetchMatchesById(id: string, region: string) {
    const { data } = await axios.request({
      url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${process.env.RIOT_API_KEY}`,
    })

    return data
  }

  public async findMatchesByIds(ids: string[]) {
    return await prisma.match.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  }
}
