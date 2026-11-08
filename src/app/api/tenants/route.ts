import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const tenantInput = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
  unitName: z.string().min(2).max(120).optional(),
});

export async function GET() {
  const db = getDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const where = session.role === 'SUPER_ADMIN' ? {} : { id: session.tenantId ?? '' };
  const tenants = await db.tenant.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { units: true, contracts: true, users: true } } },
  });
  return NextResponse.json(tenants);
}

export async function POST(request: Request) {
  const db = getDb();
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  const parsed = tenantInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 });

  try {
    const tenant = await db.tenant.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        units: parsed.data.unitName ? { create: { name: parsed.data.unitName } } : undefined,
      },
      include: { _count: { select: { units: true, contracts: true, users: true } } },
    });
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    return NextResponse.json({ error: code === 'P2002' ? 'Já existe uma empresa com esse identificador.' : 'Não foi possível cadastrar a empresa.' }, { status: 400 });
  }
}
