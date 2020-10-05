import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import YahooFantasy = require('yahoo-fantasy');
import { StandingsDao } from '../dao/standingsDao';
import { leagueKeys } from '../model/leagueKeys';

export const getStandingData = async (yf: YahooFantasy) => {
    const draftResultDao = new StandingsDao(new DocumentClient);

    console.log('Getting standing data');

    await Promise.all(leagueKeys.map(async leagueKey => getStandingDataForLeague(yf, draftResultDao, leagueKey)));
}

const getStandingDataForLeague = async (yf: YahooFantasy, dao: StandingsDao, leagueKey: string) => {
    const standingsResults = await yf.league.standings(leagueKey);

    console.log('Getting standing data');
    console.log(JSON.stringify(standingsResults));

    const promises = standingsResults.standings.map(async standing => {
        await dao.putStanding({
            teamName: standing.name,
            teamId: standing.team_key,
            manager: standing.managers[0].nickname,
            managerId: standing.managers[0].guid,
            year: standingsResults.season,
            rank: Number(standing.standings.rank),
            wins: Number(standing.standings.outcome_totals.wins),
            losses: Number(standing.standings.outcome_totals.losses),
            pointsFor: Number(standing.standings.points_for),
            pointsAgainst: Number(standing.standings.points_against)
        });

        console.log("put the item");
    });

    await Promise.all(promises);
}