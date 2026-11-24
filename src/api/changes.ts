const EVENT = 'lyra:api-records-changed';
export function notifyApiChange(resource: string) { window.dispatchEvent(new CustomEvent(EVENT, { detail: resource })); }
export function subscribeApiChanges(resources: string[], listener: () => void) {
  const receive = (event: Event) => { if (resources.includes('*') || resources.includes((event as CustomEvent<string>).detail)) listener(); };
  window.addEventListener(EVENT, receive);
  return () => window.removeEventListener(EVENT, receive);
}
