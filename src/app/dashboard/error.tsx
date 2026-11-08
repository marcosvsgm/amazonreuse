'use client';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="login">
      <section>
        <p className="eyebrow">AMAZON REUSE</p>
        <h1>Não foi possível carregar o dashboard</h1>
        <p className="muted">Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.</p>
        <button type="button" onClick={reset}>Tentar novamente</button>
      </section>
    </main>
  );
}
