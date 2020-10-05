import "reflect-metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DraftResultDao } from "../dao/draftResultDao";
import { instance, mock, verify, when } from 'ts-mockito';

describe('DraftResultDao', () => {
    const mockDocumentClient = mock(DocumentClient);

    const draftResultDao = new DraftResultDao(instance(mockDocumentClient));

    describe('putDraftResult', () => {
        const sampleYear = 2015;
        const sampleTeamName = 'Juck Foe';
        const sampleManager = 'William';
        const samplePlayerName = 'Todd Gurley';
        const samplePick = 1;
        const sampleRound = 1;
        const samplePlayerId = '1235';
        const sampleTeamId = '12333';
        const pointsScored = 123.8;
        const managerId = '56679';
        const samplePlayerPosition = 'RB';

        it('will save the draft result with correct parition and sort key', async () => {
            // when(mockDocumentClient.put).thenReturn(new Promise({}));

            await draftResultDao.putDraftResult({
                year: sampleYear,
                teamName: sampleTeamName,
                manager: sampleManager,
                playerName: samplePlayerName,
                pick: samplePick,
                round: sampleRound,
                playerId: samplePlayerId,
                teamId: sampleTeamId,
                pointsScored: pointsScored,
                managerId: managerId,
                playerPosition: samplePlayerPosition
            });
    
            verify(mockDocumentClient.put({
                TableName: 'ThrowUpTheXTable',
                Item: {
                    pk: sampleYear,
                    sk: managerId + '#' + samplePick,
                    year: sampleYear,
                    teamName: sampleTeamName,
                    manager: sampleManager,
                    playerName: samplePlayerName,
                    pick: samplePick,
                    round: sampleRound,
                    playerId: samplePlayerId,
                    teamId: sampleTeamId,
                    pointsScored: pointsScored
                }
            })).once();
        });
    });
});