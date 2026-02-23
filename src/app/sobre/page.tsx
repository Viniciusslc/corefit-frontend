export default function SobrePage() {
  return (
    <main className="corefit-bg">
      <div
        className="corefit-container"
        style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 900 }}
      >
        {/* HERO */}
        <section style={{ marginBottom: 60 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Sobre o Corefit
          </h1>
          <p className="text-muted-soft" style={{ fontSize: 18, lineHeight: 1.6 }}>
            O Corefit é um app criado para organizar treinos, registrar performance e
            acompanhar evolução de forma simples e visual — com foco em consistência.
          </p>
        </section>

        {/* VISÃO */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>A proposta</h2>
          <p className="text-muted-soft" style={{ lineHeight: 1.7 }}>
            A ideia é unir o que realmente importa no treino: execução, progressão e
            histórico. Você cria seus treinos, registra o que fez na hora, e depois consegue
            ver como está evoluindo com base em dados reais.
          </p>
        </section>

        {/* COMO FUNCIONA */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Como funciona</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>1) Crie seus treinos</div>
              <div className="text-muted-soft" style={{ lineHeight: 1.6 }}>
                Monte treinos com exercícios, séries, reps e metas de peso. Tudo fica salvo no
                seu perfil.
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>2) Execute e registre</div>
              <div className="text-muted-soft" style={{ lineHeight: 1.6 }}>
                Durante o treino, registre reps e carga por série com rapidez. O sistema salva
                automaticamente sua performance.
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>3) Acompanhe evolução</div>
              <div className="text-muted-soft" style={{ lineHeight: 1.6 }}>
                Veja seu histórico e entenda sua progressão. O objetivo é transformar dados em
                motivação.
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>O que vem por aí</h2>
          <p className="text-muted-soft" style={{ lineHeight: 1.7, marginBottom: 14 }}>
            O Corefit está em constante evolução. As próximas melhorias seguem uma linha bem
            clara: performance + experiência premium.
          </p>

          <ul style={{ lineHeight: 1.9 }}>
            <li>• Dashboard de performance com volume, séries, PRs e gráficos</li>
            <li>• Comparação automática com último treino</li>
            <li>• Sugestões inteligentes de carga e progressão</li>
            <li>• IA para gerar treinos e trocar exercícios de forma inteligente</li>
            <li>• Estrutura de planos e melhorias na experiência mobile</li>
          </ul>
        </section>

        {/* FECHAMENTO */}
        <section>
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Obrigado por fazer parte dessa fase
            </div>
            <div className="text-muted-soft" style={{ lineHeight: 1.6 }}>
              Se você chegou até aqui, já faz parte do começo. A ideia é simples:
              <b> constância</b> + <b>registro</b> + <b>evolução</b>.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}