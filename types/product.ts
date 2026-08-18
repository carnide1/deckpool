export interface ProductIndexEntry {
  id: string;
  packId: string;
  name: string;
  leaderId: string;
  type: "starter";
}

export type ProductContents = Record<string, number>;
