import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
export type Session = { userId:string; tenantId:string|null; role:string; name:string };
const key = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-change-me');
export async function createSession(data: Session) { return new SignJWT(data).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('8h').sign(key); }
export async function getSession(): Promise<Session|null> { const token=(await cookies()).get('ar_session')?.value; if(!token) return null; try { return (await jwtVerify(token,key)).payload as unknown as Session; } catch (error) { console.warn(JSON.stringify({event:'auth.session_verification_failed',errorType:error instanceof Error?error.name:'UnknownError'})); return null; } }
export function canAccessTenant(session:Session, tenantId:string) { return session.role==='SUPER_ADMIN' || session.tenantId===tenantId; }
