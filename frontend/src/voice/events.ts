export const VOICE_FINAL_EVENT = "voice:final";

export function emitVoiceFinal(text: string): void {
  window.dispatchEvent(new CustomEvent(VOICE_FINAL_EVENT, { detail: text }));
}

export function onVoiceFinal(handler: (text: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(VOICE_FINAL_EVENT, listener);
  return () => window.removeEventListener(VOICE_FINAL_EVENT, listener);
}
