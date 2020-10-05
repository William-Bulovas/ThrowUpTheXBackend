import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'
import { Standing } from '../model/standings';
import { HistoricalStanding } from "../model/historicalStanding";

@injectable()
export class StandingsDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly STANDING_PREFIX = 'STANDING';
    private readonly HISTORICAL_PREFIX = 'HISTORICAL';

    constructor(private readonly documentClient: DocumentClient) {}

    async putStanding(standing: Standing): Promise<void> {
       await this.documentClient.put({
           TableName: this.TABLE_NAME,
           Item: {
               pk: standing.managerId,
               sk: this.STANDING_PREFIX + '#' + standing.year, 
               gsiIndex: standing.year,
               gsiSort: this.STANDING_PREFIX + '#' + this.createRankString(standing.rank) + '#' + standing.managerId,
               ...standing
           }
       }).promise();
    }
    
    async getStandingsForYear(year: string): Promise<Standing[]> {
        console.log('gsiIndex = :year and begins_with(gsiSort, :prefix)');

        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            IndexName: 'gsi',
            KeyConditionExpression: 'gsiIndex = :year and begins_with(gsiSort, :prefix)',
            ExpressionAttributeValues: {
                ':year' : year,
                ':prefix': this.STANDING_PREFIX
            }
        }).promise();
        
        return results.Items as Standing[];
    }
    
    // TODO Split out historical standing from season results
    async getStandingsForManager(player: string): Promise<Standing[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :player and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':player' : player,
                ':prefix': this.STANDING_PREFIX
            }
        }).promise();
        
        return results.Items as Standing[];
    }

    async putHistoricalStanding(standing: HistoricalStanding): Promise<void> {
        console.log('Putting Historical item');

        await this.documentClient.put({
            TableName: this.TABLE_NAME,
            Item: {
                pk: standing.managerId,
                sk: this.STANDING_PREFIX + '#' + this.HISTORICAL_PREFIX, 
                gsiIndex: this.STANDING_PREFIX + '#' + this.HISTORICAL_PREFIX,
                gsiSort: this.STANDING_PREFIX + '#' + standing.managerId,
                ...standing
            }
         }).promise()
    }

    async getHistoricalStandings(): Promise<HistoricalStanding[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            IndexName: 'gsi',
            KeyConditionExpression: 'gsiIndex = :year',
            ExpressionAttributeValues: {
                ':year' : this.STANDING_PREFIX + '#' + this.HISTORICAL_PREFIX,
            }
        }).promise();
        
        return results.Items as HistoricalStanding[];
    }

    private createRankString(pick: number): string {
        return (new Array(2).join('0') + pick).slice(-2);
    }
}