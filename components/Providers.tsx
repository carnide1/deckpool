"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProfileProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!bg-[var(--bg-panel)] !text-[var(--ink-primary)] !border !border-[var(--bg-inset)] !text-sm",
          }}
        />
      </UserProfileProvider>
    </AuthProvider>
  );
}
