import { MatchupOverview } from "./matchupOverview";

export interface MatchupRecord extends MatchupOverview {
    recordManager: string,
    recordPoints: number
}

export enum MatchupRecordType {
    HIGHEST = "Highest",
    LOWEST = "Lowest"
}