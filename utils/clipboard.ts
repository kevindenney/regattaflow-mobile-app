export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const nav: any =
      typeof globalThis !== 'undefined' ? (globalThis as any).navigator : undefined;

    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }

    const doc: any =
      typeof globalThis !== 'undefined' ? (globalThis as any).document : undefined;

    if (doc?.createElement) {
      const textarea = doc.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.top = '-1000px';

      doc.body?.appendChild(textarea);
      textarea.select();
      const success = doc.execCommand?.('copy') ?? false;
      doc.body?.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.warn('[copyToClipboard] Failed to copy text', error);
  }

  return false;
}
