export const MOCK_SESSION_KEY = 'cleanpro.mock-session';
export function clearMockSession() {
  sessionStorage.removeItem(MOCK_SESSION_KEY);
}
