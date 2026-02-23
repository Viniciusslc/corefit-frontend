export default function FuncionalidadesPage() {
  return (
    <main className="corefit-bg">
      <div
        className="corefit-container"
        style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 900 }}
      >
        {/* HERO */}
        <section style={{ marginBottom: 60 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Evolução real começa com controle real.
          </h1>
          <p className="text-muted-soft" style={{ fontSize: 18, lineHeight: 1.6 }}>
            O Corefit transforma seus treinos em dados, progresso e performance
            mensurável. Cada repetição conta. Cada carga importa.
          </p>
        </section>

        {/* TREINOS */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Treinos organizados e prontos para executar
          </h2>
          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Crie e organize seus treinos com estrutura clara de exercícios,
            séries e metas de carga.
          </p>

          <ul style={{ lineHeight: 1.8 }}>
            <li>• Criar treinos personalizados</li>
            <li>• Definir séries e faixa de repetições</li>
            <li>• Estabelecer meta de carga</li>
            <li>• Organizar ordem de execução</li>
            <li>• Aplicar técnicas específicas</li>
          </ul>
        </section>

        {/* EXECUÇÃO */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Execução em tempo real
          </h2>
          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Durante o treino, registre repetições e cargas com rapidez e
            precisão.
          </p>

          <ul style={{ lineHeight: 1.8 }}>
            <li>• Ajuste rápido com + e −</li>
            <li>• Indicador visual de progresso</li>
            <li>• Comparação automática com meta</li>
            <li>• Salvamento automático</li>
            <li>• Controle de tempo de treino</li>
          </ul>
        </section>

        {/* HISTÓRICO */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Histórico completo
          </h2>
          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Acompanhe todos os treinos finalizados com métricas detalhadas.
          </p>

          <ul style={{ lineHeight: 1.8 }}>
            <li>• Total de séries executadas</li>
            <li>• Total de repetições</li>
            <li>• Volume total levantado</li>
            <li>• Duração do treino</li>
            <li>• Organização cronológica</li>
          </ul>
        </section>

        {/* PERFORMANCE */}
        <section style={{ marginBottom: 50 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Métrica de performance
          </h2>
          <p className="text-muted-soft" style={{ marginBottom: 16 }}>
            Compare meta vs execução e acompanhe sua evolução de forma clara.
          </p>

          <ul style={{ lineHeight: 1.8 }}>
            <li>• Média de carga realizada</li>
            <li>• Diferença em relação à meta</li>
            <li>• Indicadores visuais de desempenho</li>
          </ul>
        </section>

        {/* FUTURO */}
        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Em evolução constante
          </h2>
          <p className="text-muted-soft">
            O Corefit está evoluindo para incluir gráficos de progressão,
            recordes pessoais, comparação com treinos anteriores e sugestões
            inteligentes baseadas na sua performance.
          </p>
        </section>
      </div>
    </main>
  );
}