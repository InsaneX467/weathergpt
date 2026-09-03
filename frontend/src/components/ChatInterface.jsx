import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../utils/api";
import ReactMarkdown from "react-markdown";

export default function ChatInterface({ language, location, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Weather in Delhi",
    "Will it rain in Mumbai tomorrow?",
    "Farmer advisory for Jaipur",
    "Aviation briefing for Chennai",
    "Climate trends for Bangalore",
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

      // Text-to-speech
      if ("speechSynthesis" in window && result.response) {
        const utterance = new SpeechSynthesisUtterance(result.response.replace(/[#*_|`\-]/g, "").substring(0, 300));
        const langMap = {
          en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
          mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
        };
        utterance.lang = langMap[language] || "en-IN";
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        // Don't auto-play TTS, let user trigger it
      }
    } catch (err) {
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
    <div className="glass-card chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🌤️</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: 8, fontSize: "1.1rem" }}>
              Welcome to WeatherGPT
            </h3>
            <p style={{ fontSize: "0.88rem", maxWidth: 400, margin: "0 auto" }}>
              Ask me about weather anywhere in the world. I can provide forecasts,
              alerts, crop advisories, aviation briefings, and more!
            </p>
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

      {suggestions.length > 0 && messages.length < 3 && (
        <div className="chat-suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="suggestion-pill"
              onClick={() => handleSend(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <button
          className={`voice-btn ${isRecording ? "recording" : ""}`}
          onClick={toggleVoice}
          title={t.voiceHint}
        >
          {isRecording ? "⏹️" : "🎤"}
        </button>
        <input
          className="chat-input"
          type="text"
          placeholder={language === "hi" ? "अपना सवाल पूछें..." : "Ask about weather anywhere..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : t.send}
        </button>
      </div>
    </div>
  );
}
