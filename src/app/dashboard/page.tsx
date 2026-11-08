import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

class DashboardQueryError extends Error {
  constructor(readonly operation: string, readonly original: unknown) {
    super(`Dashboard query failed: ${operation}`);
  }
}

type SafeErrorDetails = { errorName: string; message: string; code?: string; cause?: SafeErrorDetails };

function safeErrorDetails(error: unknown, includeCause = true): SafeErrorDetails {
  const source = error instanceof Error ? error : new Error('Unknown error');
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const cause = typeof error === 'object' && error !== null && 'cause' in error ? error.cause : undefined;
  const message = source.message
    .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '[redacted]')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[redacted]')
    .slice(0, 500);
  return {
    errorName: source.name,
    message,
    ...(code ? { code } : {}),
    ...(includeCause && cause ? { cause: safeErrorDetails(cause, false) } : {}),
  };
}

function classifyRuntimeError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('query_compiler_bg.wasm')) {
    return { category: 'prisma_wasm_asset_missing', missingAsset: 'query_compiler_bg.wasm' };
  }
  return {};
}

function dashboardQuery<T>(operation: string, query: Promise<T>) {
  return query.catch((error: unknown): never => { throw new DashboardQueryError(operation, error); });
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  let stage = 'session';

  try {
    const session = await getSession();
    if (!session || !session.userId || !session.name || !session.role) redirect('/login');

    stage = 'database_initialization';
    const db = getDb();
    const requestedTenant = (await searchParams).tenant;
    stage = 'tenant_selection';
    const tenantId = session.role === 'SUPER_ADMIN'
      ? (await dashboardQuery('tenant_selection', db.tenant.findFirst({ where: requestedTenant ? { slug: requestedTenant } : { slug: 'senai-demo' } })))?.id
      : session.tenantId;
    if (!tenantId) redirect('/login');

    stage = 'dashboard_queries';
    const [tenant, units, rawMeasurements, campaigns, documents, rawCompanies] = await Promise.all([
      dashboardQuery('tenant', db.tenant.findUnique({ where: { id: tenantId } })),
      dashboardQuery('unit_count', db.unit.count({ where: { tenantId } })),
      dashboardQuery('waste_measurements', db.wasteMeasurement.findMany({ where: { tenantId }, orderBy: { measuredAt: 'desc' }, take: 100 })),
      dashboardQuery('campaign_count', db.campaign.count({ where: { tenantId } })),
      dashboardQuery('document_count', db.document.count({ where: { tenantId } })),
      dashboardQuery('companies', db.tenant.findMany({ where: session.role === 'SUPER_ADMIN' ? {} : { id: tenantId }, orderBy: { name: 'asc' }, include: { _count: { select: { units: true, contracts: true, users: true } } } })),
    ]);
    if (!tenant) redirect('/login');

    const measurements = rawMeasurements.map((measurement) => ({ id: measurement.id, wasteType: measurement.wasteType, weightKg: Number(measurement.weightKg), source: measurement.source }));
    const total = measurements.reduce((sum, measurement) => sum + measurement.weightKg, 0);
    const companies = rawCompanies.map((company) => ({ id: company.id, name: company.name, slug: company.slug, units: company._count.units, contracts: company._count.contracts, users: company._count.users }));

    return <DashboardShell user={session} tenant={tenant.name} data={{ units, measurements, total, campaigns, documents }} companies={companies} />;
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const original = error instanceof DashboardQueryError ? error.original : error;
    console.error(JSON.stringify({ event: 'dashboard.render_failed', stage, ...(error instanceof DashboardQueryError ? { operation: error.operation } : {}), ...classifyRuntimeError(original), ...safeErrorDetails(original) }));
    throw new Error('Não foi possível carregar o dashboard.');
  }
}
