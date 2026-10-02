"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InviteCard } from "@/components/friends/InviteCard";

function InvitePageContent() {
  const params = useParams<{ code: string }>();
  return <InviteCard code={params.code} />;
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--ink-muted)]">Loading invite…</p>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
