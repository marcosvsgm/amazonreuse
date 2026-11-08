import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

function allowed(role: string) { return role === 'SUPER_ADMIN' || role === 'CONSULTANT'; }
export async function GET() {
  const s = await getSession(); if (!s || !allowed(s.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  return NextResponse.json(await getDb().rolePermission.findMany({ where: s.role === 'SUPER_ADMIN' ? {} : { tenantId: s.tenantId ?? '' } }));
}
export async function PUT(req: Request) {
  const s = await getSession(); if (!s || !allowed(s.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const b = await req.json() as { role: string; module: string; view: boolean; create: boolean; update: boolean; delete: boolean; export: boolean; tenantId?: string };
  const tenantId = s.role === 'SUPER_ADMIN' ? (b.tenantId ?? '') : (s.tenantId ?? '');
  const data = { role: b.role as never, module: b.module, view: b.view, create: b.create, update: b.update, delete: b.delete, export: b.export };
  const row = await getDb().rolePermission.upsert({ where: { tenantId_role_module: { tenantId, role: data.role, module: data.module } }, create: { tenantId, ...data }, update: data });
  return NextResponse.json(row);
}
