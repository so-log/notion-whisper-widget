import { useState, useEffect } from "react";

const MOCK_ITEMS = [
  { id: 1, text: "비행기 예약하기 ✈️", done: false },
  { id: 2, text: "물 마시기 💧", done: false },
  { id: 3, text: "API 문서 정리", done: false },
  { id: 4, text: "운동 30분 🏃", done: false },
  { id: 5, text: "팀 미팅 준비", done: true },
];

const MessageBubble = ({ text, isVisible, delay = 0, isFirst = false }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-start",
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
      transition: `all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
    }}
  >
    <div
      style={{
        maxWidth: 280,
        background: "linear-gradient(180deg, #E9E9EB 0%, #E1E1E4 100%)",
        borderRadius: isFirst ? "18px 18px 18px 4px" : "4px 18px 18px 4px",
        padding: "10px 14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.4,
          fontWeight: 400,
          color: "#000",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          letterSpacing: "-0.2px",
        }}
      >
        {text}
      </div>
    </div>
  </div>
);

const UnreadLabel = ({ count, isVisible }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-start",
      marginBottom: 6,
      opacity: isVisible ? 1 : 0,
      transition: "opacity 0.4s ease 0.05s",
    }}
  >
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "rgba(255,255,255,0.55)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        textShadow: "0 1px 4px rgba(0,0,0,0.4)",
        letterSpacing: "-0.1px",
      }}
    >
      읽지 않음 · {count}개
    </span>
  </div>
);

const DesktopMockup = ({ children, wallpaper }) => {
  const wallpapers = {
    sonoma: "linear-gradient(160deg, #1a1a3e 0%, #2d1b69 25%, #4a2c8a 45%, #7b4db5 60%, #c084fc 75%, #e9a8ff 90%, #fbc2eb 100%)",
    sequoia: "linear-gradient(160deg, #0c1445 0%, #1a3a6b 30%, #1e5f8a 50%, #3a8ba5 70%, #6cb4c4 85%, #a5d8e6 100%)",
    dark: "linear-gradient(160deg, #0f0f1a 0%, #1a1a2e 30%, #1e2640 60%, #252545 100%)",
    ventura: "linear-gradient(160deg, #f97316 0%, #ea580c 25%, #c2410c 45%, #7c2d12 65%, #431407 85%, #1c0a00 100%)",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 880,
        aspectRatio: "16/10",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        background: wallpapers[wallpaper] || wallpapers.sonoma,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.03) 0%, transparent 55%)",
        }}
      />

      {/* Menu Bar */}
      <div
        style={{
          height: 28,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          justifyContent: "space-between",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>&#63743;</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "-apple-system, sans-serif" }}>
            Finder
          </span>
          {["File", "Edit", "View", "Go"].map((m) => (
            <span key={m} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", fontFamily: "-apple-system, sans-serif" }}>
              {m}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "-apple-system, sans-serif" }}>
          화 2월 24일 오후 3:42
        </span>
      </div>

      {/* Desktop */}
      <div style={{ position: "relative", height: "calc(100% - 28px)" }}>
        {/* Dock */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            borderRadius: 18,
            padding: "6px 10px",
            display: "flex",
            gap: 5,
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          {["🔍", "📁", "🌐", "💬", "📧", "🎵", "⚙️"].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
};

export default function NotionWhisperV4() {
  const [isVisible, setIsVisible] = useState(false);
  const [wallpaper, setWallpaper] = useState("sonoma");
  const [position, setPosition] = useState("bottomLeft");

  useEffect(() => {
    setIsVisible(false);
    const t = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(t);
  }, [wallpaper, position]);

  const items = MOCK_ITEMS.filter((i) => !i.done);

  const positionStyles = {
    bottomLeft: { bottom: 80, left: 24 },
    topLeft: { top: 20, left: 24 },
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 24px",
        gap: 28,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>💬</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Notion Whisper
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
          노션이 보내는 읽지 않은 메시지 — 데스크톱에 조용히 떠있어요
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {[
            { key: "sonoma", label: "Sonoma" },
            { key: "sequoia", label: "Sequoia" },
            { key: "dark", label: "Dark" },
            { key: "ventura", label: "Ventura" },
          ].map((w) => (
            <button
              key={w.key}
              onClick={() => setWallpaper(w.key)}
              style={{
                padding: "5px 11px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 500,
                background: wallpaper === w.key ? "rgba(255,255,255,0.1)" : "transparent",
                color: wallpaper === w.key ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "all 0.2s",
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {[
            { key: "bottomLeft", label: "↙ 좌하단" },
            { key: "topLeft", label: "↖ 좌상단" },
            { key: "center", label: "중앙" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPosition(p.key)}
              style={{
                padding: "5px 11px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 500,
                background: position === p.key ? "rgba(255,255,255,0.1)" : "transparent",
                color: position === p.key ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Mockup */}
      <DesktopMockup wallpaper={wallpaper}>
        <div
          style={{
            position: "absolute",
            ...positionStyles[position],
            maxWidth: 300,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <UnreadLabel count={items.length} isVisible={isVisible} />
          {items.map((item, i) => (
            <MessageBubble
              key={item.id}
              text={item.text}
              isVisible={isVisible}
              delay={0.08 + i * 0.08}
              isFirst={i === 0}
            />
          ))}
        </div>
      </DesktopMockup>

      {/* Info */}
      <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>
            노션에서 보낸 메시지를 받은 느낌 — 회색 iMessage 말풍선이 왼쪽에서 떠요.
            할일을 완료하면 메시지가 "읽음" 처리되며 사라지고, "읽지 않음" 카운트가 줄어들어요.
            은근한 압박감으로 할일을 잊지 않게 해주는 데스크톱 위젯.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: "⚛️", title: "React + TS" },
            { icon: "🖥️", title: "Electron" },
            { icon: "📡", title: "Notion API" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <span>{item.icon}</span>
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
