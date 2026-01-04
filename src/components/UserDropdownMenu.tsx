/**
 * UserDropdownMenu Component
 *
 * Dropdown menu with user avatar and account options.
 * Displays user email initials in avatar and provides quick access to:
 * - Settings page
 * - Logout action
 */

import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/db/supabase.client";

export interface UserDropdownMenuProps {
  userEmail?: string;
}

/**
 * Extracts initials from email address
 * @example getInitials("john.doe@example.com") => "JD"
 * @example getInitials("user@example.com") => "U"
 */
function getInitials(email?: string): string {
  if (!email) return "?";

  const namePart = email.split("@")[0];
  const parts = namePart.split(/[._-]/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return namePart[0].toUpperCase();
}

export function UserDropdownMenu({ userEmail }: UserDropdownMenuProps) {
  const initials = getInitials(userEmail);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      // Redirect to login page after successful logout
      window.location.href = "/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      // Still redirect even if signOut fails
      window.location.href = "/login";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-10 rounded-full" aria-label="Menu użytkownika">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-none font-medium">Twoje konto</p>
            {userEmail && <p className="text-muted-foreground text-xs leading-none">{userEmail}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings" className="cursor-pointer">
            <Settings />
            Ustawienia
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
          <LogOut />
          Wyloguj
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
