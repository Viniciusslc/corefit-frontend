export default function PlanosPage() {
  return (
    <main className="corefit-bg">
      <div
        className="corefit-container"
        style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 900 }}
      >
        {/* HERO */}
        <section style={{ marginBottom: 60 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Escolha seu nível de evolução
          </h1>
          <p className="text-muted-soft" style={{ fontSize: 18, lineHeight: 1.6 }}>
            O Corefit está evoluindo para se tornar uma plataforma completa de
            performance. Comece gratuitamente e acompanhe o crescimento do produto.
          </p>
        </section>

        {/* FREE */}
        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
            Corefit Free (Beta)
          </h2>

          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Ideal para quem quer organizar e registrar seus treinos.
          </p>

          <ul style={{ lineHeight: 1.8, marginBottom: 20 }}>
            <li>• Criação de treinos personalizados</li>
            <li>• Registro de repetições e cargas</li>
            <li>• Meta de peso por exercício</li>
            <li>• Histórico completo de treinos</li>
            <li>• Acesso em qualquer dispositivo</li>
          </ul>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              marginBottom: 12,
            }}
          >
            <strong>Preço:</strong> Gratuito durante o período Beta
          </div>
        </section>

        {/* PRO */}
        <section>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
            Corefit Pro (Em desenvolvimento)
          </h2>

          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Para quem quer evoluir com dados, métricas e inteligência aplicada ao treino.
          </p>

          <ul style={{ lineHeight: 1.8, marginBottom: 20 }}>
            <li>• Dashboard avançado de performance</li>
            <li>• Comparação automática com treinos anteriores</li>
            <li>• Registro de recordes pessoais (PR)</li>
            <li>• Gráficos de progressão de carga</li>
            <li>• Insights de consistência semanal</li>
            <li>• Sugestão inteligente de carga</li>
            <li>• IA para geração e ajuste de treinos</li>
          </ul>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <strong>Preço:</strong> Valor em definição  
            <p className="text-muted-soft" style={{ marginTop: 8 }}>
              Estamos estruturando o plano Pro para oferecer o melhor custo-benefício possível.
              Em breve divulgaremos os detalhes oficiais.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}