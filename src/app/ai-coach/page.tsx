export default function AiCoachPage() {
  return (
    <main className="corefit-bg">
      <div
        className="corefit-container"
        style={{
          paddingTop: 120,
          paddingBottom: 120,
          maxWidth: 700,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            marginBottom: 24,
          }}
        >
          🤖
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>
          IA Coach
        </h1>

        <p
          className="text-muted-soft"
          style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 32 }}
        >
          Estamos desenvolvendo uma inteligência que irá analisar sua performance,
          sugerir progressões de carga e otimizar seus treinos automaticamente.
        </p>

        <div
          style={{
            padding: 20,
            borderRadius: 14,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          🚧 Em construção — será liberado em breve.
        </div>
      </div>
    </main>
  );
}