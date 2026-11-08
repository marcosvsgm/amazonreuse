import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:'Não autorizado'},{status:401});return NextResponse.json(await getDb().unit.findMany({where:s.role==='SUPER_ADMIN'?{}:{tenantId:s.tenantId??''},select:{id:true,name:true,tenantId:true},orderBy:{name:'asc'}}));}
