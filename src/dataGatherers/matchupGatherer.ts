import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import YahooFantasy = require('yahoo-fantasy');
import { MatchupDao } from '../dao/matchupDao';
import { weeks } from '../model/weeks';

export const getMatchupOverview = async (leagueKey: string, yf: YahooFantasy) => {
    const matchupDao = new MatchupDao(new DocumentClient);

    await Promise.all(weeks.map(async week => {
        const scoreboard = await yf.league.scoreboard(leagueKey, week);

        console.log('Getting scoreboard data');

        await Promise.all(scoreboard.scoreboard.matchups.map(async score => {
            console.log(JSON.stringify(score));
            console.log('Year = ' + scoreboard.season);
            await matchupDao.putMatchupOverview(
                scoreboard.season, 
                parseInt(week),
                {
                    teamName: score.teams[0].name,
                    teamId: score.teams[0].team_key,
                    teamPoints: parseFloat(score.teams[0].points.total),
                    manager: score.teams[0].managers[0].nickname,
                    managerId: score.teams[0].managers[0].guid
                },
                {
                    teamName: score.teams[1].name,
                    teamId: score.teams[1].team_key,
                    teamPoints: parseFloat(score.teams[1].points.total),
                    manager: score.teams[1].managers[0].nickname,
                    managerId: score.teams[1].managers[0].guid
                }
            );    
        }))
    }));
}
