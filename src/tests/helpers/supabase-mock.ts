/**
 * Supabase Mock Helper
 *
 * Provides typed mock for Supabase client used in service tests
 * Uses Vitest's vi.fn() for creating mock functions
 */

import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a mock Supabase client for testing
 *
 * Returns a partial mock with common methods that can be extended
 * per test case using mockImplementation()
 */
export function createMockSupabase(): SupabaseClientType {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
      },
    },
  } as unknown as SupabaseClientType;
}

/**
 * Creates a mock query builder for chaining Supabase queries
 *
 * Example usage:
 * ```ts
 * const mockFrom = createMockQueryBuilder({
 *   data: [{ id: '123', name: 'Test' }],
 *   error: null
 * });
 * mockSupabase.from.mockReturnValue(mockFrom);
 * ```
 */
export function createMockQueryBuilder<T>(result: { data: T | null; error: unknown; count?: number | null }) {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };

  // For queries without .single() or .maybeSingle()
  Object.assign(mockBuilder, {
    then: (resolve: (value: { data: T | null; error: unknown; count?: number | null }) => void) => {
      return Promise.resolve(result).then(resolve);
    },
  });

  return mockBuilder;
}
