export interface MatchupOverview {
    pk?: string,
    sk?: string,
    gsiIndex?: string,
    gsiSort?: string,

    winnterTeamId: string,
    winnerName: string,
    year: string,
    week: number,
    semi: boolean,
    thirdPlaceGame: boolean,
    finals: boolean,

    teamA: MatchupTeamOverview,
    teamB: MatchupTeamOverview
}

export interface MatchupTeamOverview {
    teamName: string,
    teamId: string,
    manager: string,
    managerId: string,
    teamPoints: number,
}