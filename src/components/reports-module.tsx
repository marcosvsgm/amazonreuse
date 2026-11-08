"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
type C = { id: string; name: string };
type U = { id: string; name: string; tenantId: string };
type R = {
  id: string;
  tenantId: string;
  unitId: string;
  name: string;
  type: string;
  format: string;
  startsAt: string;
  endsAt: string;
  responsible: string;
  status: string;
  createdAt: string;
  tenant: { name: string };
  unit: { name: string } | null;
};
type ReportDetail = { report: R; summary: Record<string, number> };
type ApiError = { error?: string };
const isReportDetail = (value: unknown): value is ReportDetail =>
  typeof value === "object" &&
  value !== null &&
  "report" in value &&
  "summary" in value &&
  typeof (value as ReportDetail).summary === "object" &&
  (value as ReportDetail).summary !== null;
const isApiError = (value: unknown): value is ApiError =>
  typeof value === "object" && value !== null && "error" in value;
const types: Record<string, string> = {
  WASTE: "Gestão de Resíduos",
  COLLECTIONS: "Coletas e Destinação",
  PGRS: "PGRS",
  INSPECTIONS: "Inspeções e Conformidade",
  CAMPAIGNS: "Campanhas e Treinamentos",
  ESG: "Indicadores ESG",
  CONSOLIDATED: "Relatório Ambiental Consolidado",
};
export function ReportsModule({
  companies,
  isSuperAdmin,
}: {
  companies: C[];
  isSuperAdmin: boolean;
}) {
  const [rows, setRows] = useState<R[]>([]),
    [units, setUnits] = useState<U[]>([]),
    [q, setQ] = useState(""),
    [company, setCompany] = useState(""),
    [kind, setKind] = useState(""),
    [period, setPeriod] = useState(""),
    [open, setOpen] = useState(false),
    [detail, setDetail] = useState<ReportDetail | null>(null),
    [actionError, setActionError] = useState("");
  const load = async () => {
    const r = await fetch("/api/reports");
    if (r.ok) setRows((await r.json()) as R[]);
  };
  const fetchDetail = async (id: string): Promise<ReportDetail | null> => {
    setActionError("");
    const response = await fetch(`/api/reports/${id}`);
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !isReportDetail(body)) {
      setActionError(
        isApiError(body) && body.error
          ? body.error
          : "Não foi possível carregar o relatório.",
      );
      return null;
    }

    return body;
  };
  useEffect(() => {
    void load();
    fetch("/api/units")
      .then((r) => r.json() as Promise<U[]>)
      .then(setUnits);
  }, []);
  const shown = useMemo(
    () =>
      rows.filter(
        (x) =>
          (!q || x.name.toLowerCase().includes(q.toLowerCase())) &&
          (!company || x.tenantId === company) &&
          (!kind || x.type === kind) &&
          (!period || x.createdAt.slice(0, 7) === period),
      ),
    [rows, q, company, kind, period],
  );
  const month = new Date().toISOString().slice(0, 7);
  return (
    <>
      <div className="hero">
        <div>
          <p className="eyebrow">CENTRAL DE DOCUMENTOS</p>
          <h1>Relatórios</h1>
          <p>Gere análises ambientais com dados reais da operação.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          + Novo relatório
        </button>
      </div>
      <section className="project-metrics">
        <Metric n={rows.length} l="Relatórios gerados" />
        <Metric
          n={rows.filter((x) => x.createdAt.slice(0, 7) === month).length}
          l="Gerados no mês"
        />
        <Metric
          n={new Set(rows.map((x) => x.tenantId)).size}
          l="Empresas com relatórios"
        />
        <Metric
          n={
            rows[0]
              ? new Date(rows[0].createdAt).toLocaleDateString("pt-BR")
              : "—"
          }
          l="Última geração"
        />
      </section>
      <section className="report-types">
        <h2>Tipos de relatórios</h2>
        <div>
          {Object.entries(types).map(([k, v]) => (
            <article key={k}>
              <strong>{v}</strong>
              <p>
                {k === "CONSOLIDATED"
                  ? "Reúne os principais dados ambientais em um único documento."
                  : "Dados registrados no módulo de " + v + "."}
              </p>
              <button
                onClick={() => {
                  setKind(k);
                  setOpen(true);
                }}
              >
                Gerar relatório
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="project-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar relatório"
          />
          {isSuperAdmin && (
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <option value="">Todas as empresas</option>
              {companies.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          )}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos os tipos</option>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        {actionError && <p className="error">{actionError}</p>}
        <div className="report-head">
          <span>NOME / TIPO</span>
          <span>EMPRESA / UNIDADE</span>
          <span>PERÍODO</span>
          <span>GERAÇÃO / RESPONSÁVEL</span>
          <span>STATUS</span>
          <span>AÇÕES</span>
        </div>
        {shown.length ? (
          shown.map((x) => (
            <div className="report-row" key={x.id}>
              <strong>
                {x.name}
                <small>{types[x.type]}</small>
              </strong>
              <span>
                {x.tenant.name}
                <small>{x.unit?.name}</small>
              </span>
              <span>
                {new Date(x.startsAt).toLocaleDateString("pt-BR")} —{" "}
                {new Date(x.endsAt).toLocaleDateString("pt-BR")}
              </span>
              <span>
                {new Date(x.createdAt).toLocaleDateString("pt-BR")}
                <small>{x.responsible}</small>
              </span>
              <i className="status">Concluído</i>
              <div className="project-actions">
                <button
                  onClick={async () => {
                    const reportDetail = await fetchDetail(x.id);
                    if (reportDetail) setDetail(reportDetail);
                  }}
                >
                  Visualizar
                </button>
                <button
                  onClick={async () => {
                    const reportDetail = await fetchDetail(x.id);
                    if (!reportDetail) return;
                    const csv = Object.entries(reportDetail.summary)
                      .map(([a, b]) => `${a};${b}`)
                      .join("\n");
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(
                      new Blob([csv], { type: "text/csv" }),
                    );
                    a.download = `${x.name}.csv`;
                    a.click();
                  }}
                >
                  Baixar
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    if (confirm("Excluir relatório?")) {
                      await fetch(`/api/reports/${x.id}`, { method: "DELETE" });
                      void load();
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <span>◌</span>
            <h2>Nenhum relatório gerado</h2>
            <p>Selecione um tipo acima para gerar o primeiro relatório.</p>
          </div>
        )}
      </section>
      {open && (
        <Form
          companies={companies}
          units={units}
          company={company}
          type={kind}
          admin={isSuperAdmin}
          close={() => setOpen(false)}
          done={load}
        />
      )}{" "}
      {detail && (
        <div className="modal-backdrop">
          <section className="project-modal">
            <button className="close" onClick={() => setDetail(null)}>
              ×
            </button>
            <p className="eyebrow">VISUALIZAÇÃO DO RELATÓRIO</p>
            <h2>{detail.report.name}</h2>
            <p className="project-detail">
              {types[detail.report.type]}
              <br />
              {detail.report.tenant.name} · {detail.report.unit?.name}
              <br />
              {new Date(detail.report.startsAt).toLocaleDateString(
                "pt-BR",
              )} a {new Date(detail.report.endsAt).toLocaleDateString("pt-BR")}
            </p>
            <h3>Resumo dos dados apurados</h3>
            {Object.entries(detail.summary).map(([k, v]) => (
              <div className="document-item" key={k}>
                <b>{k}</b>: {v}
              </div>
            ))}
            <button className="primary full" onClick={() => window.print()}>
              Imprimir / salvar em PDF
            </button>
          </section>
        </div>
      )}
    </>
  );
}
function Form({
  companies,
  units,
  company,
  type,
  admin,
  close,
  done,
}: {
  companies: C[];
  units: U[];
  company: string;
  type: string;
  admin: boolean;
  close: () => void;
  done: () => Promise<void>;
}) {
  const [t, setT] = useState(company),
    [error, setError] = useState("");
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const b: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(
      new FormData(e.currentTarget),
    );
    b.tenantId = t;
    b.includeCharts = (
      e.currentTarget.elements.namedItem("includeCharts") as HTMLInputElement
    ).checked;
    b.includeAttachments = (
      e.currentTarget.elements.namedItem(
        "includeAttachments",
      ) as HTMLInputElement
    ).checked;
    const r = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    if (!r.ok) {
      setError(
        ((await r.json()) as { error?: string }).error || "Erro ao gerar.",
      );
      return;
    }
    await done();
    close();
  };
  return (
    <div className="modal-backdrop">
      <form className="project-modal" onSubmit={save}>
        <button type="button" className="close" onClick={close}>
          ×
        </button>
        <p className="eyebrow">NOVO RELATÓRIO</p>
        <h2>Configurar relatório</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Nome
          <input name="name" required />
        </label>
        <label>
          Tipo
          <select name="type" defaultValue={type}>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {admin && (
          <label>
            Empresa
            <select value={t} onChange={(e) => setT(e.target.value)} required>
              <option value="">Selecione</option>
              {companies.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Unidade
          <select name="unitId" required>
            <option value="">Selecione</option>
            {units
              .filter((x) => !t || x.tenantId === t)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Período inicial
            <input name="startsAt" type="date" required />
          </label>
          <label>
            Período final
            <input name="endsAt" type="date" required />
          </label>
        </div>
        <label>
          Formato
          <select name="format">
            <option value="PDF">PDF</option>
            <option value="EXCEL">Excel</option>
          </select>
        </label>
        <label>
          <input name="includeCharts" type="checkbox" defaultChecked /> Incluir
          gráficos
        </label>
        <label>
          <input name="includeAttachments" type="checkbox" /> Incluir anexos e
          evidências disponíveis
        </label>
        <label>
          Observações
          <textarea name="notes" />
        </label>
        <button className="primary full">Gerar relatório</button>
      </form>
    </div>
  );
}
function Metric({ n, l }: { n: string | number; l: string }) {
  return (
    <article>
      <strong>{n}</strong>
      <span>{l}</span>
    </article>
  );
}
// @ts-nocheck
