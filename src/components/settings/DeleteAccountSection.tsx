/**
 * DeleteAccountSection Component
 *
 * Danger zone section for account deletion.
 * Displays warning card with delete button and manages dialog state.
 * Handles post-deletion redirect to login page.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import type { DeleteAccountSectionProps } from "./types";

export function DeleteAccountSection({ onDeleteSuccess }: DeleteAccountSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Handles successful account deletion
   * Redirects to login page
   */
  const handleDeleteSuccess = () => {
    // Call parent callback if provided
    onDeleteSuccess();

    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
          <CardDescription>
            Usunięcie konta jest operacją nieodwracalną. Wszystkie Twoje dane zostaną trwale usunięte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
            Usuń konto
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={handleDeleteSuccess} />
    </>
  );
}
