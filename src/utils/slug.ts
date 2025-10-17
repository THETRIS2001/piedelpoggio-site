// Utility per la gestione degli slug
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
    .trim()
    .replace(/\s+/g, '-') // Sostituisce spazi con trattini
    .replace(/-+/g, '-'); // Rimuove trattini multipli
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

export function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, '');
}