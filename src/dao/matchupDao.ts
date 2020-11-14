import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { injectable } from 'tsyringe'
import { MatchupOverview, MatchupTeamOverview } from "../model/matchupOverview";
import { MatchupDetail } from "../model/matchupDetail";
import { MatchupRecord, MatchupRecordType } from "../model/matchupRecord";

@injectable()
export class MatchupDao {
    private readonly TABLE_NAME = 'ThrowUpTheXTable';
    private readonly MATCHUP_PREFIX = 'MATCHUP';
    private readonly MATCHUP_DETAIL_PREFIX = 'MATCHUP_DETAIL';
    private readonly MATCHUP_RECORD_PREFIX = 'MATCHUP_RECORD';
    private readonly MATCHUP_RECORD_DIFFERENCE_PREFIX = 'MATCHUP_RECORD_DIFFERENCE';

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
    
    async getMatchupData(managerIdA: string, managerIdB = ''): Promise<MatchupOverview[]> {
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
            KeyConditionExpression: 'gsiIndex = :managerA and begins_with(gsiSort, :prefix)',
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

    async putMatchupRecord(detail: MatchupOverview): Promise<void> {
        const fixedTeamAPoints = Math.floor(detail.teamA.teamPoints * 100);
        const fixedTeamBPoints = Math.floor(detail.teamB.teamPoints * 100);

        const differential = Math.abs(fixedTeamAPoints - fixedTeamBPoints);

        delete detail.pk;
        delete detail.sk;
        delete detail.gsiIndex;
        delete detail.gsiSort;

        await this.documentClient.transactWrite({
            TransactItems: [
                 {
                     Put: {
                         TableName: this.TABLE_NAME,
                         Item: {
                            pk: this.MATCHUP_RECORD_PREFIX,
                            sk: this.MATCHUP_RECORD_PREFIX + '#' + this.createScoreString(fixedTeamAPoints) + '#' 
                                + detail.teamA.managerId + '#' + detail.year + '#' + detail.week, 
                            recordManager: detail.teamA.manager,
                            recordPoints: detail.teamA.teamPoints,
                            ...detail
                        }
                     }
                 },
                 {
                     Put: {
                         TableName: this.TABLE_NAME,
                         Item: {
                            pk: this.MATCHUP_RECORD_PREFIX,
                            sk: this.MATCHUP_RECORD_PREFIX + '#' + this.createScoreString(fixedTeamBPoints) + '#' 
                                + detail.teamB.managerId + '#' + detail.year + '#' + detail.week, 
                            recordManager: detail.teamB.manager,
                            recordPoints: detail.teamB.teamPoints,
                            ...detail
                        }
                     }
                 },
                 {
                    Put: {
                        TableName: this.TABLE_NAME,
                        Item: {
                            pk: this.MATCHUP_RECORD_DIFFERENCE_PREFIX,
                            sk: this.MATCHUP_RECORD_DIFFERENCE_PREFIX + '#' + this.createScoreString(differential) + '#' 
                                + detail.teamA.managerId + '#' + detail.teamB.managerId + '#' + detail.year + '#' + detail.week, 
                            ...detail
                       }
                    }
                }
             ]
        }).promise(); 
    }

    async getMatchupRecords(type: MatchupRecordType): Promise<MatchupRecord[]> {
        const ascending = type === MatchupRecordType.LOWEST; 

        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :pkprefix and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pkprefix': this.MATCHUP_RECORD_PREFIX,
                ':prefix': this.MATCHUP_RECORD_PREFIX
            },
            Limit: 10,
            ScanIndexForward: ascending
        }).promise();
        
        return results.Items as MatchupRecord[];
    }

    async getMatchupDifferentialRecords(type: MatchupRecordType): Promise<MatchupRecord[]> {
        const ascending = type === MatchupRecordType.LOWEST; 

        const results = await this.documentClient.query({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: 'pk = :pkprefix and begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pkprefix': this.MATCHUP_RECORD_DIFFERENCE_PREFIX,
                ':prefix': this.MATCHUP_RECORD_DIFFERENCE_PREFIX
            },
            Limit: 10,
            ScanIndexForward: ascending
        }).promise();
        
        return results.Items as MatchupRecord[];
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

    private createScoreString(score: number): string {
        return (new Array(5).join('0') + score).slice(-5);
    }
}
