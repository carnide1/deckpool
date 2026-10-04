export type StandardRules = {
  minBlock: number;
  banned: string[];
  restricted: { cardId: string; max: number }[];
  bannedPairs: [string, string][];
};
