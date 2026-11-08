'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });

      if (response.ok) {
        router.replace('/dashboard');
        router.refresh();
        return;
      }

      setError(response.status === 401 ? 'E-mail ou senha inválidos.' : 'Não foi possível acessar agora. Tente novamente.');
    } catch {
      setError('Não foi possível acessar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="login"><form onSubmit={submit}><span className="logo">↟</span><p className="eyebrow">AMAZON REUSE</p><h1>Gestão ambiental integrada</h1><p className="muted">Acesse o ambiente da sua empresa.</p><label>E-mail<input name="email" type="email" defaultValue="admin@amazonreuse.com.br" required /></label><label>Senha<input name="password" type="password" defaultValue="AmazonReuse2026!" required /></label>{error && <p className="error">{error}</p>}<button disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button><small>Demo: admin@amazonreuse.com.br</small></form></main>;
}
