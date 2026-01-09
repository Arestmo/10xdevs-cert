/**
 * Unit tests for AccountService
 *
 * Tests cover:
 * - Account deletion via Supabase Auth Admin API
 * - Error handling for deletion failures
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountService, AccountDeletionError } from "./account.service";
import { createMockSupabase } from "@/tests/helpers/supabase-mock";

describe("AccountService", () => {
  let service: AccountService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const mockUserId = crypto.randomUUID();

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new AccountService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("deleteAccount()", () => {
    it("should delete account successfully", async () => {
      // Arrange
      mockSupabase.auth.admin.deleteUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      await service.deleteAccount(mockUserId);

      // Assert
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw AccountDeletionError when deletion fails", async () => {
      // Arrange
      mockSupabase.auth.admin.deleteUser = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "User not found" },
      });

      // Act & Assert
      await expect(service.deleteAccount(mockUserId)).rejects.toThrow(AccountDeletionError);
      await expect(service.deleteAccount(mockUserId)).rejects.toThrow("Failed to delete user account");
    });

    it("should include error details in thrown error", async () => {
      // Arrange
      const errorMessage = "Database connection failed";
      mockSupabase.auth.admin.deleteUser = vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      try {
        await service.deleteAccount(mockUserId);
        expect.fail("Should have thrown AccountDeletionError");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountDeletionError);
        expect((error as AccountDeletionError).message).toContain(errorMessage);
      }
    });
  });
});
