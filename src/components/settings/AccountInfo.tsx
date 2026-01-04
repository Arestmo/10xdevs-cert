import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountInfoProps } from "./types";

/**
 * AccountInfo Component
 *
 * Displays basic account information (email address) in a card format.
 * This is a presentational component with no interactivity.
 *
 * @param email - User's email address
 */
export function AccountInfo({ email }: AccountInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o koncie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-sm font-medium">Email</span>
            <span className="font-mono text-sm">{email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
