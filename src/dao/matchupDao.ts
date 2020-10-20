import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'
import { MatchupOverview, MatchupTeamOverview } from "../model/matchupOverview";
import { MatchupDetail } from "../model/matchupDetail";

@injectable()
export class MatchupDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly MATCHUP_PREFIX = 'MATCHUP';
    private readonly MATCHUP_DETAIL_PREFIX = 'MATCHUP_DETAIL';

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
                            sk: this.MATCHUP_PREFIX + '#' + teamB.managerId + '#' + year + '#' + this.createWeekString(week),
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
                            sk: this.MATCHUP_PREFIX + '#' + teamA.managerId + '#' + year + '#' + this.createWeekString(week),
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
        console.log('ManagerIdA ' + managerIdA)
        console.log('ManagerIdB ' + managerIdB)

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

    async putMatchupDetail(managerIdA: string, managerIdB: string, matchupDetail: MatchupDetail) {
        await this.documentClient.transactWrite({
            TransactItems: [
                 {
                     Put: {
                         TableName: this.TABLE_NAME,
                         Item: {
                            pk: managerIdA,
                            sk: this.MATCHUP_DETAIL_PREFIX + '#' + managerIdB + '#' + matchupDetail.year + 
                                '#' + this.createWeekString(matchupDetail.week) + '#' + matchupDetail.playerId,
                            gsiIndex: matchupDetail.year,
                            gsiSort: this.MATCHUP_DETAIL_PREFIX + '#' + this.createWeekString(matchupDetail.week) + 
                                '#' + managerIdA + '#' + managerIdB + '#' + matchupDetail.playerId,
                            ...matchupDetail
                        }
                     }
                 },
                 {
                     Put: {
                         TableName: this.TABLE_NAME,
                         Item: {
                            pk: managerIdB,
                            sk: this.MATCHUP_DETAIL_PREFIX + '#' + managerIdA + '#' + matchupDetail.year + 
                                '#' + this.createWeekString(matchupDetail.week) + '#' + matchupDetail.playerId,
                            ...matchupDetail
                        }
                     }
                 }
             ]
        }).promise(); 
    }

    async getMatchupDetail(managerIdA: string, managerIdB: string, week: number, year: string): Promise<MatchupDetail[]> {
        console.log('ManagerIdA ' + managerIdA)
        console.log('ManagerIdB ' + managerIdB)
        console.log(this.MATCHUP_DETAIL_PREFIX + '#' + managerIdB + '#' + year + '#' + this.createWeekString(week))

        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :managerA and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':managerA' : managerIdA,
                ':prefix': this.MATCHUP_DETAIL_PREFIX + '#' + managerIdB + '#' + year + '#' + this.createWeekString(week)
            }
        }).promise();
        
        return results.Items as MatchupDetail[];
    }

    private getWinnterId(teamA: MatchupTeamOverview, teamB: MatchupTeamOverview) {
        if (teamA.teamPoints > teamB.teamPoints) {
            return teamA.managerId;
        }

        return teamB.managerId;
    }

    private getWinnterName(teamA: MatchupTeamOverview, teamB: MatchupTeamOverview) {
        if (teamA.teamPoints > teamB.teamPoints) {
            return teamA.manager;
        }

        return teamB.manager;
    }

    private createWeekString(pick: number): string {
        return (new Array(2).join('0') + pick).slice(-2);
    }
}
