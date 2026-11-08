'use client';

import { useEffect, useMemo, useState } from 'react';

type Company = { id: string; name: string };
type User = { id: string; name: string; email: string; role: string; tenantId: string | null; status: string; tenant: { name: string } | null; unit: { name: string } | null };
type Invitation = { id: string };
const roles: Record<string, string> = { SUPER_ADMIN: 'Super Administrador', CONSULTANT: 'Administrador da Consultoria', CLIENT_ADMIN: 'Gestor da Empresa', OPERATOR: 'Responsável da Unidade', TECHNICAL_MANAGER: 'Técnico Ambiental', VIEWER: 'Visualizador' };

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  const hasName = (item: unknown): item is { name: string } => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).name === 'string';
  return typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string' && typeof user.role === 'string' && typeof user.status === 'string' && (typeof user.tenantId === 'string' || user.tenantId === null) && (user.tenant === null || hasName(user.tenant)) && (user.unit === null || hasName(user.unit));
}

export function UsersPermissionsModule({ companies, isSuperAdmin }: { companies: Company[]; isSuperAdmin: boolean }) {
  const [rows, setRows] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error(`Não foi possível carregar os usuários (${response.status}).`);
      const body: unknown = await response.json();
      if (typeof body !== 'object' || body === null) throw new Error('Resposta inválida ao carregar usuários.');
      const data = body as Record<string, unknown>;
      if (!Array.isArray(data.users) || !data.users.every(isUser) || !Array.isArray(data.invitations)) throw new Error('Resposta inválida ao carregar usuários.');
      setRows(data.users);
      setInvitations(data.invitations.filter((item): item is Invitation => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).id === 'string'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os usuários.');
    }
  };

  useEffect(() => { void load(); }, []);
  const shown = useMemo(() => rows.filter((user) => (!query || `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())) && (!company || user.tenantId === company) && (!role || user.role === role) && (!status || user.status === status)), [rows, query, company, role, status]);
  const setUserStatus = async (user: User) => {
    const response = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }) });
    if (!response.ok) setMessage('Não foi possível atualizar o usuário.'); else void load();
  };

  return <><div className="hero"><div><p className="eyebrow">ADMINISTRAÇÃO DE ACESSOS</p><h1>Usuários e Permissões</h1><p>Controle usuários, convites e acessos por empresa e unidade.</p></div></div><section className="project-metrics"><Metric n={rows.length} l="Usuários cadastrados" /><Metric n={rows.filter((user) => user.status === 'ACTIVE').length} l="Usuários ativos" /><Metric n={invitations.length} l="Convites pendentes" /></section>{message && <p className="error">{message}</p>}<section className="panel"><div className="project-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou e-mail" />{isSuperAdmin && <select value={company} onChange={(event) => setCompany(event.target.value)}><option value="">Todas empresas</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}<select value={role} onChange={(event) => setRole(event.target.value)}><option value="">Todos os perfis</option>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></div><div className="user-head"><span>NOME / E-MAIL</span><span>EMPRESA / UNIDADE</span><span>PERFIL</span><span>STATUS</span><span>AÇÕES</span></div>{shown.map((user) => <div className="user-row" key={user.id}><strong>{user.name}<small>{user.email}</small></strong><span>{user.tenant?.name}<small>{user.unit?.name || '—'}</small></span><span>{roles[user.role] || user.role}</span><i className="status">{user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</i><div className="project-actions"><button onClick={() => void setUserStatus(user)}>{user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}</button></div></div>)}{shown.length === 0 && <p>Nenhum usuário encontrado.</p>}</section></>;
}

function Metric({ n, l }: { n: number; l: string }) { return <article><strong>{n}</strong><span>{l}</span></article>; }
