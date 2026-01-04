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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <span className="text-sm font-mono">{email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
