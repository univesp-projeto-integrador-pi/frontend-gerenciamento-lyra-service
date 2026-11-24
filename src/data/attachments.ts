/** Files are deliberately never serialized into browser storage. */
const files = new Map<string, File>();
window.addEventListener('lyra:session-ended', () => files.clear());
export const attachments = {
  set(id: string, file: File) { files.set(id, file); },
  get(id: string) { return files.get(id); },
  delete(id: string) { files.delete(id); },
};
export function validateFile(file: File, photo = false) {
  const types = photo ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png'];
  if (!types.includes(file.type)) throw new Error(photo ? 'Selecione uma imagem JPG ou PNG.' : 'Selecione um arquivo PDF, JPG ou PNG.');
  if (file.size > (photo ? 5 : 10) * 1024 * 1024) throw new Error(`O tamanho máximo é ${photo ? 5 : 10} MB.`);
}
