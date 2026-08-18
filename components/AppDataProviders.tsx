"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { DecksProvider } from "@/contexts/DecksContext";

/** Static catalog + Firestore collection/decks — authenticated shell only. */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CollectionProvider>
        <DecksProvider>{children}</DecksProvider>
      </CollectionProvider>
    </CatalogProvider>
  );
}
