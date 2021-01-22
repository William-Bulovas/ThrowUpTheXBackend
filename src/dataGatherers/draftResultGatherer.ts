import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import YahooFantasy = require('yahoo-fantasy');
import { DraftResultDao } from '../dao/draftResultDao';
import { leagueKeys } from '../model/leagueKeys';

export const getDraftData = async(yf: YahooFantasy, key: string) => {
    const draftResultDao = new DraftResultDao(new DocumentClient);

    await getDataForLeagueKey(yf, draftResultDao, key);
}

const getDataForLeagueKey = async (yf: YahooFantasy, dao: DraftResultDao, leagueKey: string) => {
    const teamsResult = await yf.league.teams(leagueKey);
    console.log(teamsResult);

    console.log(JSON.stringify(teamsResult));

    const teams = teamsResult.teams;

    const draftResults = await yf.league.draft_results(leagueKey);

    console.log(JSON.stringify(draftResults));

    const year = draftResults.season;
    const promises = draftResults.draft_results.map(async (result) => {
        console.log("Going through the results");

        const team = teams.filter(team => team.team_key == result.team_key)[0];

        console.log(JSON.stringify(team));

        const playerResults = await yf.league.players(leagueKey, [result.player_key]);

        await dao.putDraftResult({
            teamName: team.name,
            teamId: result.team_key,
            manager: team.managers[0].nickname,
            managerId: team.managers[0].guid,
            playerName: playerResults.players[0].name.full,
            playerId: playerResults.players[0].player_key,
            playerPosition: playerResults.players[0].display_position,
            year: year,
            pick: result.pick,
            round: result.round,
            pointsScored: playerResults.players[0].player_points.total
        });

        console.log("put the item");
    });

    await Promise.all(promises);
}