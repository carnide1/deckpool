import type { ReactNode } from "react";
import { FriendShell } from "@/components/friends/FriendShell";

export default function FriendLayout({ children }: { children: ReactNode }) {
  return <FriendShell>{children}</FriendShell>;
}
