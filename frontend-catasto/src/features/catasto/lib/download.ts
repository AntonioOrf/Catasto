/**
 * Salva un Blob come file scaricato dal browser. L'URL temporaneo viene
 * revocato dopo il clic: alcuni browser leggono il blob in modo asincrono,
 * quindi non subito.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
