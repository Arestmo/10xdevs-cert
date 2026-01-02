/**
 * AppHeader Component
 *
 * Main application header for authenticated users.
 * Displays logo (link to dashboard) and user dropdown menu.
 * Used across all authenticated pages.
 */

import { UserDropdownMenu } from "@/components/UserDropdownMenu";

export interface AppHeaderProps {
  userEmail?: string;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - link to dashboard */}
        <a
          href="/dashboard"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Flashcards AI - przejdź do dashboardu"
        >
          <img src="/logo.png" alt="Flashcards AI" className="h-10 w-auto" />
        </a>

        {/* User menu */}
        <UserDropdownMenu userEmail={userEmail} />
      </div>
    </header>
  );
}
