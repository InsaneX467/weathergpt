import { useState } from "react";

export default function VoiceAssist({ language, onTranscript, t }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("idle");

  const langMap = {
    en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
    mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
  };

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("not-supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setStatus("error");
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus(transcript ? "done" : "idle");
    };

    recognition.start();
  }

  return (
    <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
      <h3 style={{ marginBottom: 8, fontSize: "1.1rem" }}>🎤 Voice Assistant</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 24 }}>
        {t.voiceHint} — Ask about weather in {langMap[language]?.split("-")[0] === "en" ? "English" : "your language"}
      </p>

      {/* Large voice button */}
      <button
        onClick={startListening}
        disabled={isListening}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: isListening ? "3px solid var(--accent-rose)" : "3px solid var(--border-glass)",
          background: isListening ? "rgba(244, 63, 94, 0.15)" : "var(--bg-glass)",
          color: isListening ? "var(--accent-rose)" : "var(--text-primary)",
          fontSize: "2.5rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          animation: isListening ? "pulse-recording 1.5s ease-in-out infinite" : "none",
        }}
      >
        {isListening ? "⏹️" : "🎤"}
      </button>

      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
        {status === "listening" && "🔴 Listening..."}
        {status === "done" && "✅ Recognized"}
        {status === "error" && "❌ Error — please try again"}
        {status === "not-supported" && "⚠️ Speech recognition not supported in this browser"}
        {status === "idle" && "Ready to listen"}
      </div>

      {transcript && (
        <div style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          fontSize: "1rem",
          fontWeight: 500,
          maxWidth: 400,
          margin: "0 auto",
        }}>
          "{transcript}"
        </div>
      )}

      {/* Supported languages */}
      <div style={{ marginTop: 24 }}>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8 }}>
          Supported voice languages:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {Object.entries(langMap).map(([code, locale]) => (
            <span
              key={code}
              style={{
                background: language === code ? "rgba(59, 130, 246, 0.15)" : "var(--bg-glass)",
                border: `1px solid ${language === code ? "rgba(59, 130, 246, 0.3)" : "var(--border-glass)"}`,
                borderRadius: "var(--radius-full)",
                padding: "3px 10px",
                fontSize: "0.72rem",
                color: language === code ? "var(--accent-blue)" : "var(--text-muted)",
              }}
            >
              {locale}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
