import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import YahooFantasy = require('yahoo-fantasy');
import { MatchupDao } from '../dao/matchupDao';
import { weeks } from '../model/weeks';

export const getMatchupDetail = async (leagueKey: string, yf: YahooFantasy, startWeek: string) => {
    for (let week of weeks) {
        if (parseInt(week) < parseInt(startWeek)) {
            continue;
        }

        const matchupDao = new MatchupDao(new DocumentClient);

        const scoreboard = await yf.league.scoreboard(leagueKey, week);
    
        console.log('scoreboard: ' + JSON.stringify(scoreboard));

        for (let score of scoreboard.scoreboard.matchups) {
            for(let team of score.teams) {
                const roster = await yf.roster.players(team.team_key, week);

                console.log('Roster: ' + JSON.stringify(roster));

               for (let player of roster.roster) {

                    try {
                        const playerScore = await yf.league.players(leagueKey, [player.player_key], week);

                        console.log('playerScore: ' + JSON.stringify(playerScore));
    
                        await matchupDao.putMatchupDetail(
                            score.teams[0].managers[0].guid,
                            score.teams[1].managers[0].guid,
                            {
                                managerId: roster.managers[0].guid,
                                manager: roster.managers[0].nickname,
                                
                                playerId: playerScore.players[0].player_key,
                                playerName: playerScore.players[0].name.full,
    
                                selectedPosition: player.selected_position,
                                position: playerScore.players[0].display_position,
                                points: playerScore.players[0].player_points.total,
    
                                year: scoreboard.season,
                                week: parseInt(week)
                            }
                        )
                    } catch (e) {
                        console.log(JSON.stringify(e));
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }
}