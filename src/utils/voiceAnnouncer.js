/*
=========================================================
ATTENDX - ATTENDANCE VOICE ANNOUNCEMENT ENGINE
=========================================================
Web Speech API voice synthesizer for institutional attendance.
Announces: "Your attendance has been recorded."
upon verified database record commitment.

Features:
- Natural-sounding English voice selection (en-US, en-GB, en-IN)
- Asynchronous voice cache hydration (speechSynthesis.onvoiceschanged)
- Cooldown & key deduplication (prevents double speech on re-renders)
- Clean cancellation of previous utterances (zero stutter/queuing)
- Autoplay & user-gesture safety (never throws, non-blocking)
=========================================================
*/

class VoiceAnnouncer {
  constructor() {
    this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    this.voices = [];
    this.lastSpokenKey = null;
    this.lastSpokenTime = 0;
    this.cooldownMs = 6000; // 6-second deduplication cooldown

    if (this.isSupported) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initVoices() {
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }
    } catch (e) {
      this.voices = [];
    }
  }

  getBestEnglishVoice() {
    if (!this.voices || this.voices.length === 0) {
      this.initVoices();
    }
    if (!this.voices || this.voices.length === 0) return null;

    // Prioritized list of high-quality natural voice names
    const preferredNames = [
      "google us english",
      "google uk english female",
      "microsoft zira",
      "microsoft jenny",
      "samantha",
      "karen",
      "daniel",
      "rishi",
      "veena",
      "microsoft david"
    ];

    for (const name of preferredNames) {
      const match = this.voices.find((v) => v.name && v.name.toLowerCase().includes(name));
      if (match) return match;
    }

    // Fallback: match by standard English language locale tags
    const enUsVoice = this.voices.find((v) => v.lang === "en-US");
    if (enUsVoice) return enUsVoice;

    const enGbVoice = this.voices.find((v) => v.lang === "en-GB");
    if (enGbVoice) return enGbVoice;

    const enInVoice = this.voices.find((v) => v.lang === "en-IN");
    if (enInVoice) return enInVoice;

    const anyEnVoice = this.voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
    if (anyEnVoice) return anyEnVoice;

    return this.voices[0] || null;
  }

  /**
   * Speak attendance recorded message
   * @param {Object} options
   * @param {string} options.key - Unique session, record, or student ID for deduplication
   * @param {string} options.text - Custom announcement text (defaults to "Your attendance has been recorded.")
   * @param {string} options.source - Event source e.g. 'QR Scan' or 'Face AI Kiosk'
   */
  speakAttendanceRecorded({ key = "", text = "Your attendance has been recorded.", source = "" } = {}) {
    if (!this.isSupported) {
      console.warn("[VoiceAnnouncer] Web Speech API is not supported in this browser environment.");
      return false;
    }

    const now = Date.now();
    const dedupKey = key ? `${source}_${key}` : `GENERIC_${Math.floor(now / 5000)}`;

    // Prevent duplicate utterances within cooldown window
    if (this.lastSpokenKey === dedupKey && now - this.lastSpokenTime < this.cooldownMs) {
      return false;
    }

    try {
      // Cancel any ongoing or pending speech to prevent utterance queue stutter
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98; // Natural, clear articulation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voice = this.getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "en-US";
      } else {
        utterance.lang = "en-US";
      }

      utterance.onend = () => {
        // Completed successfully
      };

      utterance.onerror = (event) => {
        // Graceful handling of browser autoplay restrictions
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.warn("[VoiceAnnouncer] Speech playback notice:", event.error);
        }
      };

      this.lastSpokenKey = dedupKey;
      this.lastSpokenTime = now;

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn("[VoiceAnnouncer] SpeechSynthesis invocation error:", err.message);
      return false;
    }
  }
}

export const voiceAnnouncer = new VoiceAnnouncer();
export default voiceAnnouncer;
