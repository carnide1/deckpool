"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";
import { CardPrefsProvider } from "@/contexts/CardPrefsContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { DecksProvider } from "@/contexts/DecksContext";
import { WantedProvider } from "@/contexts/WantedContext";

/** Static catalog + Firestore collection/decks — authenticated shell only. */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CollectionProvider>
        <WantedProvider>
          <CardPrefsProvider>
            <DecksProvider>{children}</DecksProvider>
          </CardPrefsProvider>
        </WantedProvider>
      </CollectionProvider>
    </CatalogProvider>
  );
}
