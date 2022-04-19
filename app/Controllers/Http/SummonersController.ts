// region import
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

// cores
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'

// utilities
import { regions } from 'App/Utilities'

// constants
const prisma = new PrismaClient()
// endregion

export default class SummonersController {
  public async index(ctx: HttpContextContract) {
    const { name } = ctx.request.qs()

    if (!name) return { summoners: [] }

    await prisma.$connect()
    const summoners = await this.findSummonersByName(name)

    if (summoners.length) {
      return { summoners }
    }

    const summonersRequested = await this.fetchSummonersByName(name)

    if (summonersRequested.length) {
      await prisma.summoner.createMany({
        data: summonersRequested,
      })
    }

    const summonerStored = await this.findSummonersByName(name)

    prisma.$disconnect()

    return { summoners: summonerStored }
  }

  public async findSummonersByName(name: string) {
    return await prisma.summoner.findMany({
      where: {
        name: {
          equals: decodeURIComponent(name),
          mode: 'insensitive',
        },
      },
    })
  }

  public async fetchSummonersByName(name: string) {
    const summoners = await Promise.all(
      regions.map((region) =>
        axios
          .request({
            url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT_API_KEY}`,
          })
          .then((res) => ({ ...res.data, region }))
          .catch(() => null)
      )
    )

    return summoners
      .filter((value) => !!value)
      .map((summoner) => ({
        ...summoner,
        id: string.generateRandom(15),
        summonerId: summoner.id,
      }))
  }
}
