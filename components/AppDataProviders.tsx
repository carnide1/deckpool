"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";
import { CardPrefsProvider } from "@/contexts/CardPrefsContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { DecksProvider } from "@/contexts/DecksContext";

/** Static catalog + Firestore collection/decks — authenticated shell only. */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CollectionProvider>
        <CardPrefsProvider>
          <DecksProvider>{children}</DecksProvider>
        </CardPrefsProvider>
      </CollectionProvider>
    </CatalogProvider>
  );
}
