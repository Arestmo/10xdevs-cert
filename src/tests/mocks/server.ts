import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Mock Service Worker server for testing
 * This server intercepts HTTP requests during tests
 */
export const server = setupServer(...handlers);
