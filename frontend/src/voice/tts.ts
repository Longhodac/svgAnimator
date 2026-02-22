// Simple TTS using the browser's built-in speechSynthesis API.
// Zero-dependency, works in all modern browsers.

export function speak(text: string) {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick a good voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
        (v) => v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Daniel")
    );
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
}

export function stop() {
    if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
    }
}

export function isSpeaking(): boolean {
    return window.speechSynthesis?.speaking ?? false;
}
