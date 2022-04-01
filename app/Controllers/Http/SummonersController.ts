// region import
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

// cores
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'

// constants
const prisma = new PrismaClient()
const regions = ['la1', 'la2', 'br1', 'eun1', 'euw1', 'jp1', 'kr', 'na1', 'oc1', 'ru', 'tr1']
// endregion

export default class SummonersController {
  public async index(ctx: HttpContextContract) {
    const { name } = ctx.request.qs()

    await prisma.$connect()
    const summoners = await prisma.summoner.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    })

    if (summoners.length) {
      return { summoners }
    }

    const summonersRequested = await Promise.all(
      regions.map((region) =>
        axios
          .request({
            url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT_API_KEY}`,
          })
          .then((res) => res.data)
          .catch(() => null)
      )
    )

    const summonersValids = summonersRequested
      .filter((value) => !!value)
      .map((summoner) => ({ ...summoner, id: string.generateRandom(15) }))

    if (summonersValids.length) {
      await prisma.summoner.createMany({
        data: summonersValids,
      })
    }

    const summonersCreated = await prisma.summoner.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    })

    prisma.$disconnect()

    return { summoners: summonersCreated }
  }
}
