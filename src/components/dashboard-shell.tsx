'use client';

import { FormEvent, useMemo, useState } from 'react';
import './dashboard-shell.css';
import { ProjectsContractsModule } from './projects-contracts-module';
import { WasteManagementModule } from './waste-management-module';
import { PgrsModule } from './pgrs-module';
import { CollectionsModule } from './collections-module';
import { InspectionsModule } from './inspections-module';
import { CampaignsModule } from './campaigns-module';
import { EsgModule } from './esg-module';
import { ReportsModule } from './reports-module';
import { UsersPermissionsModuleV2 as UsersPermissionsModule } from './users-permissions-module-v2';
import { SettingsModuleV2 as SettingsModule } from './settings-module-v2';
import { ModernOverview } from './modern-overview';

const items = ['Visão geral', 'Empresas e Unidades', 'Projetos e Contratos', 'Gestão de Resíduos', 'PGRS', 'Coletas e Destinação', 'Inspeções e Conformidade', 'Campanhas e Treinamentos', 'Indicadores ESG', 'Relatórios', 'Usuários e Permissões', 'Configurações'];
type Company = { id: string; name: string; slug: string; units: number; contracts: number; users: number };
type Props = { user: { name: string; role: string }; tenant: string; data: { units: number; measurements: { id: string; wasteType: string; weightKg: number; source: string }[]; total: number; campaigns: number; documents: number }; companies: Company[] };

export function DashboardShell({ user, tenant, data, companies: initialCompanies }: Props) {
  const [page, setPage] = useState('Visão geral');
  const superAdmin = user.role === 'SUPER_ADMIN';
  const visibleItems = items.filter((item) => superAdmin || !['Empresas e Unidades', 'Usuários e Permissões'].includes(item));
  return <main className="app"><aside><div className="brand"><b>↟</b> amazon <em>reuse</em></div><p className="workspace">{superAdmin ? 'PAINEL DA CONSULTORIA' : 'PORTAL DO CLIENTE'}</p><nav>{visibleItems.map((item) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}>{item}</button>)}</nav><div className="user"><strong>{user.name}</strong><small>{user.role.replaceAll('_', ' ')}</small></div></aside><section className="main"><header><div><b>{page}</b><span>{tenant}</span></div><form action="/api/auth/logout" method="post"><button>Sair</button></form></header><div className="content">{page === 'Visão geral' ? <Overview tenant={tenant} data={data} /> : page === 'Empresas e Unidades' ? <CompaniesModule companies={initialCompanies} /> : page === 'Projetos e Contratos' ? <ProjectsContractsModule /> : page === 'Gestão de Resíduos' ? <WasteManagementModule /> : page === 'PGRS' ? <PgrsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Coletas e Destinação' ? <CollectionsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Inspeções e Conformidade' ? <InspectionsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Campanhas e Treinamentos' ? <CampaignsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Indicadores ESG' ? <EsgModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Relatórios' ? <ReportsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : page === 'Usuários e Permissões' ? <UsersPermissionsModule companies={initialCompanies} isSuperAdmin={superAdmin} /> : <Placeholder page={page} tenant={tenant} />}</div></section></main>;
}
function Overview({ tenant, data }: { tenant: string; data: Props['data'] }) { return <ModernOverview tenant={tenant} data={data} />; }
function Card({ n, l }: { n: string | number; l: string }) { return <article className="card"><strong>{n}</strong><p>{l}</p></article>; }
function CompaniesModule({ companies }: { companies: Company[] }) { const [query, setQuery] = useState(''); const filtered = useMemo(() => companies.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [companies, query]); return <><div className="hero"><div><p className="eyebrow">GESTÃO DA CONSULTORIA</p><h1>Empresas e Unidades</h1><p>Gerencie os clientes atendidos e suas unidades operacionais.</p></div></div><section className="panel companies-panel"><div className="panel-heading"><h2>Empresas clientes</h2><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa" /></div><div className="company-table-head"><span>EMPRESA</span><span>UNIDADES</span><span>CONTRATOS</span><span>USUÁRIOS</span><span>AÇÕES</span></div>{filtered.map((item) => <div className="company-row" key={item.id}><div><span className="company-mark">{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>/{item.slug}</small></span></div><b>{item.units}</b><b>{item.contracts}</b><b>{item.users}</b><a className="view-dashboard" href={`/dashboard?tenant=${encodeURIComponent(item.slug)}`}>Acessar dashboard</a></div>)}</section></>; }
function Placeholder({ page, tenant }: { page: string; tenant: string }) { if (page === 'Configurações') return <SettingsModule />; return <><div className="hero"><div><p className="eyebrow">{tenant.toUpperCase()}</p><h1>{page}</h1><p>Módulo preparado para a operação da consultoria.</p></div><button className="primary">+ Adicionar</button></div><section className="empty"><span>✓</span><h2>Módulo em estruturação</h2></section></>; }
