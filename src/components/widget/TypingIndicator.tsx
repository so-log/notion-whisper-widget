const keyframes = `
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
`

export function TypingIndicator() {
  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, #E9E9EB 0%, #E1E1E4 100%)',
            borderRadius: '18px 18px 18px 4px',
            padding: '12px 16px',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#999',
                animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
