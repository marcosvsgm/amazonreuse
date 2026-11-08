import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createSession } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });

  let user: { id: string; name: string; passwordHash: string; role: string; tenantId: string | null } | null;
  try {
    const { env } = getCloudflareContext<{ DB: D1Database }>();
    if (!env.DB) throw new Error('D1 binding unavailable');
    user = await env.DB.prepare('SELECT id, name, passwordHash, role, tenantId FROM User WHERE email = ? LIMIT 1')
      .bind(parsed.data.email)
      .first<{ id: string; name: string; passwordHash: string; role: string; tenantId: string | null }>();
  } catch (error) {
    console.error(JSON.stringify({
      event: 'auth.login.database_failure',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    }));
    return NextResponse.json({ error: 'Não foi possível concluir o login agora. Tente novamente.' }, { status: 500 });
  }

  if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSession({ userId: user.id, tenantId: user.tenantId, role: user.role, name: user.name });
  } catch (error) {
    console.error(JSON.stringify({
      event: 'auth.login.session_creation_failure',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    }));
    return NextResponse.json({ error: 'Não foi possível concluir o login agora. Tente novamente.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('ar_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
