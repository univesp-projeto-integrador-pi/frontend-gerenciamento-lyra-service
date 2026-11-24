/** Decimal text throughout: no floating-point conversion of salary. */
export function normalizeSalary(value: string): string {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe o salário no formato 3500,00, com até 10 dígitos inteiros.');
  const [whole, fraction = ''] = normalized.split('.');
  return whole.replace(/^0+(?=\d)/, '') + '.' + fraction.padEnd(2, '0');
}
export function formatSalary(value?: string | null): string {
  if (value == null) return 'Não informado';
  const [whole, fraction] = normalizeSalary(value).split('.');
  return 'R$ ' + whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + fraction;
}
