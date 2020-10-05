import YahooFantasy = require('yahoo-fantasy');
import "reflect-metadata";
import { AWSRegistry } from './injectionRegistries/awsRegistry';
import { getDraftData } from './dataGatherers/draftResultGatherer';
import { getStandingData } from './dataGatherers/standingsGatherer';
import { getHistoricalStandingData } from './dataGatherers/historicalStandingGatherer';
import { getMatchupOverview } from './dataGatherers/matchupGatherer';
import { SecretsDao } from './dao/secretsDao';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

enum DataTypes {
    Draft,
    Standings,
    Matchups
}

interface DataGathererInput {
    code: string,
    leagueCode: string,
    data: string
}

export const handler = async (input: DataGathererInput) => {
    const yahooSecrets = await (new SecretsDao(new DocumentClient)).getYahooKeys();

    const yf = new YahooFantasy(
        yahooSecrets[0].appKey,
        yahooSecrets[0].secretKey);
    yf.setUserToken(input.code);

    console.log('Data : ' + input.data);

    switch (input.data) {
        case 'Draft':
            await getDraftData(yf);
            return;
        case 'Standings':
            await getStandingData(yf);
            return;
        case 'Historical':
            await getHistoricalStandingData(yf);
            return;
        case 'MatchupOverview':
            await getMatchupOverview(input.leagueCode, yf);
            return;
    }
}