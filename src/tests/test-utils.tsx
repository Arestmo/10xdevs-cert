import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function that wraps components with common providers
 * Extend this function to add global providers (e.g., Theme, Router, etc.)
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // You can add providers here as needed
  // Example:
  // const Wrapper = ({ children }: { children: React.ReactNode }) => (
  //   <ThemeProvider>
  //     <RouterProvider>
  //       {children}
  //     </RouterProvider>
  //   </ThemeProvider>
  // );

  return render(ui, { ...options });
}

/**
 * Re-export everything from testing-library
 */
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
