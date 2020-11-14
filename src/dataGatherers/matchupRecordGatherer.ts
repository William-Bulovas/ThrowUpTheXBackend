import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { MatchupDao } from '../dao/matchupDao';
import { years } from '../model/years';

export const getMatchupRecords = async () => {
    const matchupDao = new MatchupDao(new DocumentClient);

    await Promise.all(
        years.map(async year => {
            const matchups = await matchupDao.getWeeklyMatchup(year)

            await Promise.all(matchups.map(async matchup => {
                await matchupDao.putMatchupRecord(matchup)
            }))
    }));
}
