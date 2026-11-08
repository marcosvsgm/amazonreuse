'use client';

import { useEffect, useState } from 'react';

type Company = { id: string; name: string };
type User = { id: string; name: string; email: string; role: string; status: string; tenant: { name: string } | null; unit: { name: string } | null };
type AccessProfile = { id: string; name: string; description: string; active: boolean; permissions: string };

const fixed = ['Super Administrador', 'Administrador da Consultoria', 'Gestor da Empresa', 'Responsável da Unidade', 'Técnico Ambiental', 'Visualizador'];

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  const hasName = (item: unknown): item is { name: string } => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).name === 'string';
  return typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string' && typeof user.role === 'string' && typeof user.status === 'string' && (user.tenant === null || hasName(user.tenant)) && (user.unit === null || hasName(user.unit));
}

function isAccessProfile(value: unknown): value is AccessProfile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.id === 'string' && typeof profile.name === 'string' && typeof profile.description === 'string' && typeof profile.active === 'boolean' && typeof profile.permissions === 'string';
}

function enabledPermissions(permissions: string): number {
  try {
    const parsed: unknown = JSON.parse(permissions);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? Object.values(parsed).filter((value) => value === true).length
      : 0;
  } catch {
    return 0;
  }
}

export function UsersPermissionsModuleV2({ companies: _companies, isSuperAdmin: _isSuperAdmin }: { companies: Company[]; isSuperAdmin: boolean }) {
  const [tab, setTab] = useState<'users' | 'profiles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [usersResponse, profilesResponse] = await Promise.all([fetch('/api/users'), fetch('/api/access-profiles')]);
      if (usersResponse.ok) {
        const body: unknown = await usersResponse.json();
        const records = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).users : undefined;
        if (!cancelled && Array.isArray(records) && records.every(isUser)) setUsers(records);
      }
      if (profilesResponse.ok) {
        const body: unknown = await profilesResponse.json();
        if (!cancelled && Array.isArray(body) && body.every(isAccessProfile)) setProfiles(body);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const shown = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="hero"><div><p className="eyebrow">ADMINISTRAÇÃO DE ACESSOS</p><h1>Usuários e Permissões</h1><p>Gerencie usuários e os perfis de acesso disponíveis no sistema.</p></div></div><div className="tabs"><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Usuários</button><button className={tab === 'profiles' ? 'active' : ''} onClick={() => setTab('profiles')}>Perfis e Permissões</button></div>{tab === 'users' ? <section className="panel"><div className="project-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou e-mail" /></div><div className="user-head"><span>NOME / E-MAIL</span><span>EMPRESA / UNIDADE</span><span>PERFIL</span><span>STATUS</span></div>{shown.length ? shown.map((user) => <div className="user-row" key={user.id}><strong>{user.name}<small>{user.email}</small></strong><span>{user.tenant?.name}<small>{user.unit?.name || '—'}</small></span><span>{user.role}</span><i className="status">{user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</i></div>) : <p>Nenhum usuário encontrado.</p>}</section> : <section className="panel"><div className="panel-heading"><h2>Perfis disponíveis</h2><small>Perfis padrão e personalizados</small></div><h3>Perfis padrão</h3><div className="profile-list">{fixed.map((profile) => <article key={profile}><b>{profile}</b><span>Perfil nativo do sistema</span></article>)}</div><h3>Perfis personalizados criados</h3>{profiles.length ? <div className="profile-list">{profiles.map((profile) => <article key={profile.id}><b>{profile.name}</b><span>{profile.description || 'Sem descrição'}</span><small>{enabledPermissions(profile.permissions)} módulos permitidos · {profile.active ? 'Ativo' : 'Inativo'}</small></article>)}</div> : <div className="empty"><span>◌</span><h2>Nenhum perfil personalizado cadastrado</h2><p>Crie perfis em Configurações → Perfis de acesso.</p></div>}<p className="project-detail">Os perfis personalizados passam a ficar disponíveis para atribuição em novos convites de usuário.</p></section>}</>;
}
