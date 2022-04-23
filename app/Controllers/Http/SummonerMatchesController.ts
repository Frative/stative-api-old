// region import
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

// utilities
import { regionContinent } from 'App/Utilities'

// contracts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

// interfaces
import { RiotMatch } from 'App/Interfaces'

// constants
const prisma = new PrismaClient()
// endregion

export default class SummonerMatchesController {
  public async index(ctx: HttpContextContract) {
    const { puuid, region } = ctx.request.qs()

    if (!puuid || !region) {
      return { matches: [] }
    }

    const { matchIds } = await this.fetchMatchIds(puuid, region)

    await prisma.$connect()

    const matches = await Promise.all(
      matchIds.map(async (matchId) => {

        const match = await prisma.match.findUnique({
          where: { id: matchId },
        })

        if (match) {
          return match
        }

        const { data: matchFetched }: { data: RiotMatch } = await axios.request({
          url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`,
        })

        const { participants } = matchFetched.info

        const totalDamageDealtToChampionsRank = participants.map(
          (p) => p.totalDamageDealtToChampions,
        ).sort((a, b) => a - b)
      
        const totalMinionsKilledRank = participants.map(
          (p) => p.totalMinionsKilled,
        ).sort((a, b) => a - b)
      
        const damageDealtToTurretsRank = participants.map(
          (p) => p.damageDealtToTurrets,
        ).sort((a, b) => a - b)
      
        const visionScoreRank = participants.map(
          (p) => p.visionScore,
        ).sort((a, b) => a - b)
      
        const killsRank = participants.map(
          (p) => p.kills,
        ).sort((a, b) => a - b)
      
        const deathsRank = participants.map(
          (p) => p.deaths,
        ).sort((a, b) => a - b)

        return await prisma.match.create({
          data: {
            id: matchId,
            gameCreation: matchFetched.info.gameCreation,
            gameDuration: matchFetched.info.gameDuration,
            gameMode: matchFetched.info.gameMode,
            gameVersion: matchFetched.info.gameVersion,
            participants: participants.map((p) => {
              const totalDamageDealtToChampionsScore = totalDamageDealtToChampionsRank.indexOf(p.totalDamageDealtToChampions)
              const totalMinionsKilledScore = totalMinionsKilledRank.indexOf(p.totalMinionsKilled)
              const damageDealtToTurretsScore = damageDealtToTurretsRank.indexOf(p.damageDealtToTurrets)
              const visionScore = visionScoreRank.indexOf(p.visionScore)
              const killsScore = killsRank.indexOf(p.kills)
              const deathsScore = deathsRank.indexOf(p.deaths)

              const score = Math.floor(
                (totalDamageDealtToChampionsScore * 4.4)
                + (damageDealtToTurretsScore * 3.3)
                + (totalMinionsKilledScore * 2.2)
                + (killsScore * 1.1)
                + (visionScore * 0.5)
                - deathsScore,
              )

              return {
                score,
                perks: p.perks,
                puuid: p.puuid,
                win: p.win,
                championName: p.championName,
              }
            })
          }
        })
      })
    )

    return { matches }
  }

  public async fetchMatchIds(puuid: string, region: string) {
    const { data } = await axios.request({
      url: `https://${regionContinent[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10&api_key=${process.env.RIOT_API_KEY}`,
    })

    return { matchIds: data }
  }
}
