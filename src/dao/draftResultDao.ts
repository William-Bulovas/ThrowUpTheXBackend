import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'

@injectable()
export class DraftResultDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly DRAFT_RESULT_PREFIX = 'DRAFTRESULT';

    constructor(private readonly documentClient: DocumentClient) {}

    async putDraftResult(draftResult: DraftResult): Promise<void> {
       await this.documentClient.put({
           TableName: this.TABLE_NAME,
           Item: {
               pk: draftResult.managerId,
               sk: this.DRAFT_RESULT_PREFIX + '#' + draftResult.year + '#' + this.createPickString(draftResult.pick), 
               gsiIndex: draftResult.year,
               gsiSort: this.DRAFT_RESULT_PREFIX + '#' + this.createPickString(draftResult.pick),
               ...draftResult
           }
       }).promise();
    }
    
    async getDraftResultForYear(year: string): Promise<DraftResult[]> {
        console.log('gsiIndex = :year and begins_with(gsiSort, :prefix)');

        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            IndexName: 'gsi',
            KeyConditionExpression: 'gsiIndex = :year and begins_with(gsiSort, :prefix)',
            ExpressionAttributeValues: {
                ':year' : year,
                ':prefix': this.DRAFT_RESULT_PREFIX
            }
        }).promise();
        
        return results.Items as DraftResult[];
    }
    
    async getDraftResultForPlayerAndYear(player: string, year: string): Promise<DraftResult[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :player and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':player' : player,
                ':prefix': this.DRAFT_RESULT_PREFIX + '#' + year
            }
        }).promise();
        
        return results.Items as DraftResult[];
    }
    
    async getDraftResultForPlayer(player: string): Promise<DraftResult[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :player and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':player' : player,
                ':prefix': this.DRAFT_RESULT_PREFIX
            }
        }).promise();
        
        return results.Items as DraftResult[];
    }

    private createPickString(pick: number): string {
        return (new Array(3).join('0') + pick).slice(-3);
    }
}