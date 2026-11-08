'use client';

import { useEffect, useMemo, useState } from 'react';

type Measurement = { id: string; wasteType: string; weightKg: number; source: string };
type Tenant = { id: string; name: string; slug: string };

export function ModernOverview({ tenant, data }: { tenant: string; data: { units: number; measurements: Measurement[]; total: number; campaigns: number; documents: number } }) {
  const [companies, setCompanies] = useState<Tenant[]>([]);
  useEffect(() => {
    fetch('/api/tenants').then(async response => response.ok ? await response.json() as Tenant[] : [] as Tenant[]).then(setCompanies);
  }, []);
  const total = data.total || 0;
  const weights = data.measurements;
  const grouped = useMemo(() => Object.entries(weights.reduce<Record<string, number>>((all, item) => { all[item.wasteType] = (all[item.wasteType] || 0) + item.weightKg; return all; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 2), [weights]);
  const values = weights.slice().reverse().map(item => item.weightKg);
  const max = Math.max(...values, 1);
  const path = (values.length ? values : [0]).map((value, index, items) => `${index ? 'L' : 'M'} ${items.length === 1 ? 250 : index / (items.length - 1) * 500} ${190 - value / max * 150}`).join(' ');

  return <><div className="command-hero"><div><p>AMBIENTE ATIVO</p><h1>Olá, <span>Gestor Ambiental</span> 👋</h1><small>Dados operacionais reais de {tenant}.</small></div><div className="command-actions">{companies.length > 1 && <select className="company-select" value={companies.find(company => company.name === tenant)?.slug || ''} onChange={event => { if (event.target.value) window.location.href = `/dashboard?tenant=${encodeURIComponent(event.target.value)}`; }}><option value="">{tenant}</option>{companies.map(company => <option key={company.id} value={company.slug}>{company.name}</option>)}</select>}<button className="date-filter">▣ Últimos registros</button><button className="primary">＋ Novo registro</button></div></div><section className="command-metrics"><Metric n={data.units} l="Unidades monitoradas"/><Metric n={`${total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`} l="Resíduos registrados" featured/><Metric n={data.campaigns} l="Campanhas executadas"/><Metric n={data.documents} l="Documentos ambientais"/></section><section className="command-charts"><article><div className="chart-title"><h2>Resíduos por tipo</h2><button>Ver detalhes →</button></div><div className="donut-content"><div className={`ring ${total === 0 ? 'ring-empty' : ''}`}><div><strong>{total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</strong><small>Total registrado</small></div></div><div className="legend">{grouped.length ? grouped.map(([name, value], index) => <p key={name}><i className={`legend-${index}`}/><span>{name}<b>{value.toLocaleString('pt-BR')} kg ({total ? Math.round(value / total * 100) : 0}%)</b></span></p>) : <p>Nenhum resíduo real registrado para <b>{tenant}</b>.</p>}</div></div></article><article><div className="chart-title"><h2>Evolução de resíduos</h2><button>Dados reais</button></div><div className="chart-body"><svg viewBox="0 0 500 220" preserveAspectRatio="none"><path d={`${path} L 500 220 L 0 220 Z`} fill="url(#area)"/><path d={path} fill="none" stroke="#5b32e8" strokeWidth="3"/></svg><div className="x-axis">{(values.length ? values : [0]).map((_, index) => <span key={index}>Registro {index + 1}</span>)}</div></div></article></section><section className="command-bottom"><article className="latest-table"><div className="chart-title"><h2>Últimas pesagens</h2><button>Ver todas →</button></div><div className="latest-head"><span>Tipo de resíduo</span><span>Peso (kg)</span><span>Empresa</span><span>Origem</span></div>{weights.length ? weights.slice(0, 5).map(item => <div className="latest-row" key={item.id}><span><i>♻</i>{item.wasteType}</span><b>{item.weightKg.toLocaleString('pt-BR')} kg</b><span>{tenant}</span><span>{item.source === 'WEIGHED' ? 'Pesagem real' : 'Estimativa documental'}</span></div>) : <p className="no-data">Esta empresa ainda não possui pesagens registradas.</p>}</article><article className="impact-card"><i>◒</i><h2>Gestão ambiental<br/>com impacto real</h2><p>Indicadores calculados com os dados desta empresa.</p></article></section></>;
}

function Metric({ n, l, featured }: { n: string | number; l: string; featured?: boolean }) {
  return <article className={featured ? 'featured' : ''}><em>Dados reais</em><strong>{n}</strong><span>{l}</span></article>;
}
