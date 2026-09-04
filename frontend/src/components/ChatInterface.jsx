import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../utils/api";
import ReactMarkdown from "react-markdown";

export default function ChatInterface({ language, location, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Weather in Delhi today",
    "Will it rain in Mumbai tomorrow?",
    "Farmer crop advisory for Jaipur",
    "Aviation METAR briefing for Chennai",
    "Air quality & health forecast for Bangalore",
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
        mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
      };
      recognition.lang = langMap[language] || "en-IN";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  async function handleSend(text = null) {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(
        msg, language,
        location?.latitude || null,
        location?.longitude || null,
        location?.name || null
      );

      const assistantMsg = {
        role: "assistant",
        content: result.response || "I couldn't process that request.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "⚠️ Unable to connect to the WeatherGPT server. Please ensure the backend is running on `localhost:8000`.",
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
  }

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }

  function speakText(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_|`\-]/g, "").substring(0, 500));
      const langMap = {
        en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
        mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
      };
      utterance.lang = langMap[language] || "en-IN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <div className="glass-card chat-container" style={{ display: "flex", flexDirection: "column", minHeight: "650px", height: "100%", width: "100%" }}>
      {/* Header Banner */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.3rem" }}>🤖</span>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              WeatherGPT Conversational Assistant
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {location ? `Context: ${location.name}` : "Global Meteorological AI"}
            </span>
          </div>
        </div>
        <span className="status-badge badge-success">● AI Live</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages" style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 10px", margin: "auto 0" }}>
            <div style={{ width: 64, height: 64, background: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", margin: "0 auto 16px" }}>
              🌤️
            </div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: 8, fontSize: "1.25rem", fontWeight: 800 }}>
              Welcome to WeatherGPT Intelligence
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.5 }}>
              Ask natural weather queries in English, Hindi, Bengali, or Tamil. I can analyze real-time Open-Meteo Doppler feeds, agricultural irrigation needs, and aviation crosswinds.
            </p>

            {/* Quick Capabilities Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, maxWidth: 680, margin: "0 auto" }}>
              {[
                { icon: "⚡", title: "Live Hazards & Alerts", query: "Are there any active weather warnings near me?" },
                { icon: "🌾", title: "Crop & Farming Guide", query: "Irrigation advisory for wheat crops today" },
                { icon: "✈️", title: "Aviation & Wind Vectors", query: "What are the wind speeds and visibility levels?" },
                { icon: "😷", title: "AQI & Health Guidance", query: "Is the air quality safe for outdoor running?" },
              ].map((card, i) => (
                <div
                  key={i}
                  onClick={() => handleSend(card.query)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ fontSize: "1.3rem", display: "block", marginBottom: 6 }}>{card.icon}</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: 4 }}>{card.title}</strong>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block", lineHeight: 1.3 }}>"{card.query}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === "assistant" ? (
              <div>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                <button
                  onClick={() => speakText(msg.content)}
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: "0.8rem", marginTop: 8,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  🔊 Listen
                </button>
              </div>
            ) : (
              msg.content
            )}
          </div>
        ))}

        {loading && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Suggestions + Input Dock */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", background: "#ffffff", borderRadius: "0 0 14px 14px" }}>
        {/* Quick Suggestion Pills */}
        {suggestions.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="suggestion-pill"
                onClick={() => handleSend(s)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.8rem",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
              >
                💡 {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-area" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className={`voice-btn ${isRecording ? "recording" : ""}`}
            onClick={toggleVoice}
            title={t.voiceHint || "Speak weather query"}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: isRecording ? "#f43f5e" : "#f1f5f9",
              color: isRecording ? "white" : "var(--text-primary)",
              border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "1.1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isRecording ? "⏹️" : "🎤"}
          </button>
          <input
            className="chat-input"
            type="text"
            placeholder={language === "hi" ? "मौसम संबंधी सवाल पूछें..." : "Ask about weather anywhere in natural language..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            style={{
              flex: 1, padding: "12px 18px", borderRadius: 24, border: "1px solid #cbd5e1",
              fontSize: "0.9rem", outline: "none", background: "#f8fafc",
            }}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 22px", borderRadius: 24, background: "var(--accent-blue)",
              color: "white", border: "none", fontWeight: 700, cursor: "pointer",
              fontSize: "0.88rem", opacity: (!input.trim() || loading) ? 0.6 : 1,
            }}
          >
            {loading ? "..." : (t.send || "Send ➔")}
          </button>
        </div>

        {/* Capability Footer */}
        <div style={{ marginTop: 10, textAlign: "center", fontSize: "0.74rem", color: "var(--text-muted)" }}>
          ⚡ Powered by WeatherGPT Meteorological LLM • Open-Meteo Real-time Sync
        </div>
      </div>
    </div>
  );
}
