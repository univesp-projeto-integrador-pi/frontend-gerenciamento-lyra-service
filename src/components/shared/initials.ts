export function initials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(v => v[0]).join('').toUpperCase() || '—'; }
