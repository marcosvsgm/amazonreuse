import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';
const roles=['SUPER_ADMIN','CONSULTANT','TECHNICAL_MANAGER','CLIENT_ADMIN'];
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const s=await getSession();if(!s||!roles.includes(s.role))return NextResponse.json({error:'Acesso negado'},{status:403});const db=getDb(),m=await db.wasteMeasurement.findUnique({where:{id:(await params).id}});if(!m||!canAccessTenant(s,m.tenantId))return NextResponse.json({error:'Registro não encontrado'},{status:404});await db.wasteMeasurement.delete({where:{id:m.id}});await db.auditLog.create({data:{tenantId:m.tenantId,actorId:s.userId,action:'DELETE',entity:'WasteMeasurement',entityId:m.id}});return NextResponse.json({ok:true});}
