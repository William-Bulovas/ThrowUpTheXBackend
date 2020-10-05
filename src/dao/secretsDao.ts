import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'

@injectable()
export class SecretsDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly S = 'SECRET';

    constructor(private readonly documentClient: DocumentClient) {}
    
    async getYahooKeys(): Promise<YahooSecret[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :p',
            ExpressionAttributeValues: {
                ':year' : this.S
            }
        }).promise();
        
        return results.Items as YahooSecret[];
    }
}

interface YahooSecret {
    secretKey: string,
    appKey: string
}