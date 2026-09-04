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
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* Featured Pulsing Mic Button */}
      <button
        onClick={startListening}
        disabled={isListening}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: isListening ? "3px solid #f43f5e" : "3px solid #3b82f6",
          background: isListening ? "rgba(244, 63, 94, 0.15)" : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          color: isListening ? "#f43f5e" : "#2563eb",
          fontSize: "1.8rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: isListening
            ? "0 0 20px rgba(244, 63, 94, 0.5)"
            : "0 4px 14px rgba(37, 99, 235, 0.2)",
          animation: isListening ? "pulse-recording 1.5s ease-in-out infinite" : "none",
        }}
      >
        {isListening ? "⏹️" : "🎤"}
      </button>

      {/* Voice Status Text */}
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isListening ? "#dc2626" : "var(--text-primary)", marginBottom: 8 }}>
        {status === "listening" && "🔴 Listening... Speak now"}
        {status === "done" && "✅ Recognized Speech"}
        {status === "error" && "❌ Error — Tap to try again"}
        {status === "not-supported" && "⚠️ Browser Speech Unsupported"}
        {status === "idle" && "Tap Mic & Ask Natural Weather Question"}
      </div>

      {transcript && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #bfdbfe",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: "0.84rem",
          fontWeight: 600,
          color: "#1e40af",
          marginBottom: 10,
        }}>
          "{transcript}"
        </div>
      )}

      {/* Supported Languages Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 8 }}>
        {Object.entries(langMap).map(([code, locale]) => (
          <span
            key={code}
            style={{
              background: language === code ? "#2563eb" : "#f1f5f9",
              border: `1px solid ${language === code ? "#1d4ed8" : "#e2e8f0"}`,
              borderRadius: "var(--radius-full)",
              padding: "2px 8px",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: language === code ? "#ffffff" : "var(--text-muted)",
            }}
          >
            {locale}
          </span>
        ))}
      </div>
    </div>
  );
}
