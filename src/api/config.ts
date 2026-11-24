/** Public Vite settings only: never place secrets in VITE_* variables. */
export const authMode = import.meta.env.VITE_AUTH_MODE;
export const dataMode = import.meta.env.VITE_DATA_MODE;
export const isApiData = dataMode === 'api';
export function apiOrigin() {
  const configured = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '';
  if (!configured) return ''; // Same-origin deployment / reverse proxy.
  try {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('VITE_API_URL deve ser a origem HTTP(S) da API, sem /api, credenciais ou parâmetros.'); }
}
