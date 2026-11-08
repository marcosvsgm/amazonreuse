import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  return NextResponse.json(await getDb().setting.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { tenantId: session.tenantId ?? undefined, userId: null },
      ],
    },
  }));
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json() as { scope: string; values: Record<string, string> };
  const personal = body.scope === 'PREFERENCES';
  if (!personal && !['SUPER_ADMIN', 'CONSULTANT', 'CLIENT_ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const db = getDb();
  const tenantId = personal ? null : session.tenantId;
  const userId = personal ? session.userId : null;

  for (const [key, value] of Object.entries(body.values)) {
    // Prisma's compound unique input does not accept nullable columns. Look up
    // nullable scopes explicitly before creating or updating their setting.
    const existing = await db.setting.findFirst({
      where: { tenantId, userId, scope: body.scope, key },
      select: { id: true },
    });

    if (existing) {
      await db.setting.update({ where: { id: existing.id }, data: { value } });
    } else {
      await db.setting.create({ data: { tenantId, userId, scope: body.scope, key, value } });
    }
  }

  return NextResponse.json({ ok: true });
}
