import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'
import { MatchupOverview, MatchupTeamOverview } from "../model/matchupOverview";

@injectable()
export class MatchupDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly MATCHUP_PREFIX = 'MATCHUP';

    constructor(private readonly documentClient: DocumentClient) {}

    async putMatchupOverview(year: string, week: number, teamA: MatchupTeamOverview, teamB: MatchupTeamOverview): Promise<void> {
       const winnerId = this.getWinnterId(teamA, teamB);
       const winnerName = this.getWinnterName(teamA, teamB);
       
        await this.documentClient.transactWrite({
           TransactItems: [
                {
                    Put: {
                        TableName: this.TABLE_NAME,
                        Item: {
                            pk: teamA.managerId,
                            sk: this.MATCHUP_PREFIX + '#' + teamB.managerId + '#' + year + '#' + week,
                            gsiIndex: year,
                            gsiSort: this.MATCHUP_PREFIX + '#' + week + '#' + teamA.managerId + '#' + teamB.managerId,
                            year: year,
                            week: week,
                            teamA: teamA,
                            teamB: teamB,
                            semi: false,
                            thirdPlaceGame: false,
                            finals: false,     
                            winnerId: winnerId,
                            winnerName: winnerName                   
                        }
                    }
                },
                {
                    Put: {
                        TableName: this.TABLE_NAME,
                        Item: {
                            pk: teamB.managerId,
                            sk: this.MATCHUP_PREFIX + '#' + teamA.managerId + '#' + year + '#' + week,
                            year: year,
                            week: week,
                            teamA: teamB,
                            teamB: teamA,
                            semi: false,
                            thirdPlaceGame: false,
                            finals: false,    
                            winnerId: winnerId,
                            winnerName: winnerName                                       
                        }
                    }
                }
            ]
           
       }).promise();
    }
    
    async getMatchupData(managerIdA: string, managerIdB: string): Promise<MatchupOverview[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :managerA and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':managerA' : managerIdA,
                ':prefix': this.MATCHUP_PREFIX + '#' + managerIdB
            }
        }).promise();
        
        return results.Items as MatchupOverview[];
    }

    async getWeeklyMatchup(year: string, week?: string): Promise<MatchupOverview[]> {
        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            IndexName: 'gsi',
            KeyConditionExpression: 'gsiIndex = :managerA and begins_with(gsiSortKey, :prefix)',
            ExpressionAttributeValues: {
                ':managerA' : year,
                ':prefix': this.MATCHUP_PREFIX + '#' + (week ? week : '')
            }
        }).promise();
        
        return results.Items as MatchupOverview[];
    }

    private getWinnterId(teamA: MatchupTeamOverview, teamB: MatchupTeamOverview) {
        if (teamA.teamPoints > teamB.teamPoints) {
            return teamA.teamId;
        }

        return teamB.teamId;
    }

    private getWinnterName(teamA: MatchupTeamOverview, teamB: MatchupTeamOverview) {
        if (teamA.teamPoints > teamB.teamPoints) {
            return teamA.teamName;
        }

        return teamB.teamName;
    }
}
