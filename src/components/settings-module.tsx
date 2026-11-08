'use client';

import { FormEvent, useEffect, useState } from 'react';

const tabs = ['GERAL', 'AMBIENTAL', 'NOTIFICATIONS', 'DOCUMENTS', 'SECURITY', 'PREFERENCES'] as const;
type SettingsTab = (typeof tabs)[number];

type Setting = {
  id: string;
  tenantId: string | null;
  userId: string | null;
  scope: string;
  key: string;
  value: string;
  updatedAt: string;
};

const names: Record<SettingsTab, string> = {
  GERAL: 'Geral',
  AMBIENTAL: 'Ambiental',
  NOTIFICATIONS: 'Notificações',
  DOCUMENTS: 'Documentos',
  SECURITY: 'Segurança',
  PREFERENCES: 'Preferências',
};

const fields: Record<SettingsTab, readonly (readonly [string, string])[]> = {
  GERAL: [['consultancyName', 'Nome da consultoria'], ['cnpj', 'CNPJ'], ['email', 'E-mail institucional'], ['phone', 'Telefone'], ['address', 'Endereço'], ['responsible', 'Responsável'], ['timezone', 'Fuso horário'], ['dateFormat', 'Formato de data']],
  AMBIENTAL: [['wasteCategories', 'Categorias e classificações de resíduos'], ['units', 'Unidades de medida'], ['destinations', 'Tipos de destinação'], ['documentTypes', 'Tipos de documentos ambientais'], ['inspectionFrequency', 'Periodicidade de inspeções'], ['pgrsReview', 'Prazo de revisão do PGRS'], ['defaultGoals', 'Metas ambientais padrão']],
  NOTIFICATIONS: [['documentAlert', 'Antecedência para vencimento de documentos (dias)'], ['inspectionAlert', 'Antecedência para inspeções (dias)'], ['pendingAlerts', 'Alertas de pendências ambientais'], ['pgrsAlerts', 'Atualizações de PGRS'], ['emailNotifications', 'Notificações por e-mail']],
  DOCUMENTS: [['headerLogo', 'Logotipo no cabeçalho'], ['documentName', 'Nome da consultoria nos documentos'], ['footer', 'Rodapé institucional'], ['technicalResponsible', 'Responsável técnico'], ['defaultFormat', 'Formato padrão dos relatórios'], ['numbering', 'Numeração de documentos']],
  SECURITY: [['sessionTimeout', 'Expiração da sessão (minutos)'], ['auditRetention', 'Retenção de auditoria (dias)']],
  PREFERENCES: [['theme', 'Tema (claro ou escuro)'], ['pageSize', 'Registros por página'], ['language', 'Idioma'], ['dashboardLayout', 'Preferência de exibição do dashboard']],
};

function isSetting(value: unknown): value is Setting {
  if (typeof value !== 'object' || value === null) return false;

  const setting = value as Record<string, unknown>;
  return typeof setting.id === 'string'
    && (typeof setting.tenantId === 'string' || setting.tenantId === null)
    && (typeof setting.userId === 'string' || setting.userId === null)
    && typeof setting.scope === 'string'
    && typeof setting.key === 'string'
    && typeof setting.value === 'string'
    && typeof setting.updatedAt === 'string';
}

function parseSettingsResponse(value: unknown): Setting[] {
  if (!Array.isArray(value) || !value.every(isSetting)) {
    throw new Error('A resposta de configurações possui um formato inválido.');
  }

  return value;
}

export function SettingsModule() {
  const [tab, setTab] = useState<SettingsTab>('GERAL');
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error(`Não foi possível carregar as configurações (${response.status}).`);

        const settings = parseSettingsResponse(await response.json());
        if (!cancelled) setValues(Object.fromEntries(settings.map(({ key, value }) => [key, value])));
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as configurações.');
      }
    };

    void loadSettings();
    return () => { cancelled = true; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: tab, values }),
      });
      if (!response.ok) throw new Error(`Não foi possível salvar estas configurações (${response.status}).`);
      setMessage('Alterações salvas com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar estas configurações.');
    }
  };

  return <><div className="hero"><div><p className="eyebrow">GERENCIAMENTO DA PLATAFORMA</p><h1>Configurações</h1><p>Personalize a operação, alertas e padrões institucionais.</p></div></div><div className="settings-layout"><nav>{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}><b>{names[item]}</b><small>{item === 'GERAL' ? 'Dados institucionais' : item === 'AMBIENTAL' ? 'Parâmetros ambientais' : item === 'NOTIFICATIONS' ? 'Alertas e avisos' : item === 'DOCUMENTS' ? 'Identidade e relatórios' : item === 'SECURITY' ? 'Sessões e auditoria' : 'Preferências pessoais'}</small></button>)}</nav><section className="panel"><p className="eyebrow">{names[tab]}</p><h2>{tab === 'GERAL' ? 'Dados institucionais e identificação' : names[tab]}</h2><p className="project-detail">As informações reais são carregadas e salvas conforme seu nível de acesso.</p>{message && <p className="error">{message}</p>}<form className="settings-form" onSubmit={save}>{fields[tab].map(([key, label]) => <label key={key}>{label}{key.includes('Categories') || key === 'units' || key === 'destinations' || key === 'documentTypes' || key === 'defaultGoals' || key === 'footer' || key === 'dashboardLayout' ? <textarea value={values[key] || ''} onChange={(event) => setValues({ ...values, [key]: event.target.value })} /> : <input value={values[key] || ''} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />}</label>)}{tab === 'SECURITY' && <><h3>Conta e auditoria</h3><p className="project-detail">A alteração de senha e o encerramento de sessões são feitos pelo fluxo seguro de autenticação. Registros administrativos ficam disponíveis no módulo Usuários e Permissões.</p></>}<button className="primary">Salvar alterações</button></form></section></div></>;
}
