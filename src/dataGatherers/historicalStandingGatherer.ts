import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import YahooFantasy = require('yahoo-fantasy');
import { StandingsDao } from '../dao/standingsDao';
import { HistoricalStanding } from '../model/historicalStanding';
import { leagueKeys } from '../model/leagueKeys';
import Immutable = require('immutable');

const defaultValue = (standing: any): HistoricalStanding => {
    return {
        manager: standing.managers[0].nickname,
        managerId: standing.managers[0].guid,
        yearsPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        totalPointsAgainst: 0,
        totalPointsFor: 0,
        winPercentage: 0,
        averageLosses: 0,
        averagePointsAgainst: 0,
        averagePointsFor: 0,
        averageWins: 0,
        averageRank: 0,
        rank: [],
        playoffsMade: 0,
        firstPlaces: 0,
        secondPlaces: 0,
        thirdPlaces: 0
    }
};


export const getHistoricalStandingData = async (yf: YahooFantasy) => {
    const draftResultDao = new StandingsDao(new DocumentClient);

    let standingMap: Immutable.Map<string, HistoricalStanding> = Immutable.Map();

    await Promise.all(leagueKeys.map(async leagueKey => {
        const standingsResults = await yf.league.standings(leagueKey);

        console.log('Getting standing data');
    
        standingsResults.standings.forEach(standing => standingMap = standingMap.update(
            standing.managers[0].guid,
            (value = defaultValue(standing) ) => {
                console.log('default value = ' + JSON.stringify(value));
                console.log('new value = ' + JSON.stringify(standing));
                return {
                    ...value,
                    yearsPlayed: value.yearsPlayed + 1,
                    totalWins: value.totalWins + Number(standing.standings.outcome_totals.wins),
                    totalLosses: value.totalLosses + Number(standing.standings.outcome_totals.losses),
                    totalPointsAgainst: value.totalPointsAgainst + Number(standing.standings.points_against),
                    totalPointsFor: value.totalPointsFor + Number(standing.standings.points_for),
                    rank: [...value.rank, Number(standing.standings.rank)],
                    playoffsMade: value.playoffsMade + standing.clinched_playoffs,
                    firstPlaces: value.firstPlaces + (Number(standing.standings.rank) == 1 ? 1 : 0),
                    secondPlaces: value.secondPlaces + (Number(standing.standings.rank) == 2 ? 1 : 0),
                    thirdPlaces: value.thirdPlaces + (Number(standing.standings.rank) == 3 ? 1 : 0)    
                }
            }
        ));    
    }));

    console.log('Size = ' + standingMap.size);

    await Promise.all(standingMap.toArray().map(([key, standing]) => { 
        const hist = {
            ...standing,
            averageWins: standing.totalWins / standing.yearsPlayed,
            averageLosses: standing.totalLosses / standing.yearsPlayed,
            averagePointsFor: standing.totalPointsFor / standing.yearsPlayed,
            averagePointsAgainst: standing.totalPointsAgainst / standing.yearsPlayed,
            averageRank: standing.rank.reduce((p,c) => p + c) / standing.yearsPlayed,
            winPercentage: standing.totalWins / (standing.totalWins + standing.totalLosses)
        } as HistoricalStanding;
        console.log(JSON.stringify(hist));
        return hist;
    }).map(async value =>  draftResultDao.putHistoricalStanding(value)));
}
