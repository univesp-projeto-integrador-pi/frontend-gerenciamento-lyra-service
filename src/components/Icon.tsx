type IconName = 'brand' | 'users' | 'documents' | 'helmet' | 'shield' | 'mail' | 'lock' | 'eye-off' | 'login' | 'secure';
export function Icon({ name }: { name: IconName }) {
  return <img src={`/assets/${name}.svg`} alt="" className="block shrink-0" aria-hidden="true" />;
}
