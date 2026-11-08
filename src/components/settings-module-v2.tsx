"use client";
import { FormEvent, useEffect, useState } from "react";
const tabs = [
  "GERAL",
  "AMBIENTAL",
  "NOTIFICATIONS",
  "DOCUMENTS",
  "SECURITY",
  "PREFERENCES",
  "PROFILES",
] as const;
const labels: Record<string, [string, string]> = {
  GERAL: ["Geral", "Dados institucionais"],
  AMBIENTAL: ["Ambiental", "Parâmetros ambientais"],
  NOTIFICATIONS: ["Notificações", "Alertas e avisos"],
  DOCUMENTS: ["Documentos", "Identidade e relatórios"],
  SECURITY: ["Segurança", "Sessões e auditoria"],
  PREFERENCES: ["Preferências", "Preferências pessoais"],
  PROFILES: ["Perfis de acesso", "Criação de perfis"],
};
const basic: Record<string, string[]> = {
  GERAL: [
    "Nome da consultoria",
    "CNPJ",
    "E-mail institucional",
    "Telefone",
    "Endereço",
    "Responsável",
    "Fuso horário",
  ],
  AMBIENTAL: [
    "Categorias de resíduos",
    "Unidades de medida",
    "Tipos de destinação",
    "Periodicidade de inspeções",
    "Metas ambientais padrão",
  ],
  NOTIFICATIONS: [
    "Antecedência para vencimento",
    "Avisos de inspeções",
    "Notificações por e-mail",
  ],
  DOCUMENTS: [
    "Nome nos documentos",
    "Rodapé institucional",
    "Responsável técnico",
    "Formato padrão",
  ],
  SECURITY: ["Expiração da sessão", "Retenção de auditoria"],
  PREFERENCES: ["Tema", "Registros por página", "Idioma"],
};
const modules = [
  "Visão geral",
  "Empresas e Unidades",
  "Gestão de Resíduos",
  "PGRS",
  "Coletas e Destinação",
  "Inspeções e Conformidade",
  "Campanhas e Treinamentos",
  "Indicadores ESG",
  "Relatórios",
  "Usuários e Permissões",
];
type AccessProfile = { id: string; name: string; description: string | null };
export function SettingsModuleV2() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("GERAL"),
    [profiles, setProfiles] = useState<AccessProfile[]>([]),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [permissions, setPermissions] = useState<Record<string, boolean>>({}),
    [message, setMessage] = useState("");
  const load = async () => {
    const response = await fetch("/api/access-profiles");
    if (!response.ok) {
      setProfiles([]);
      return;
    }

    const body: unknown = await response.json();
    setProfiles(Array.isArray(body) ? (body as AccessProfile[]) : []);
  };
  useEffect(() => {
    void load();
  }, []);
  const create = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/access-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, permissions }),
    });
    if (r.ok) {
      setName("");
      setDescription("");
      setPermissions({});
      setMessage("Perfil criado com sucesso.");
      void load();
    } else setMessage("Não foi possível criar o perfil.");
  };
  return (
    <>
      <div className="hero">
        <div>
          <p className="eyebrow">GERENCIAMENTO DA PLATAFORMA</p>
          <h1>Configurações</h1>
          <p>Personalize a operação, alertas e padrões institucionais.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav>
          {tabs.map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              <b>{labels[x][0]}</b>
              <small>{labels[x][1]}</small>
            </button>
          ))}
        </nav>
        <section className="panel">
          {tab === "PROFILES" ? (
            <>
              <p className="eyebrow">PERFIS DE ACESSO</p>
              <h2>Crie perfis personalizados</h2>
              <p className="project-detail">
                Defina os módulos que cada perfil poderá acessar. As permissões
                são aplicadas pela administração do sistema.
              </p>
              {message && <p className="error">{message}</p>}
              <form className="settings-form" onSubmit={create}>
                <label>
                  Nome do perfil
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Auditor externo"
                    required
                  />
                </label>
                <label>
                  Descrição
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Finalidade e público do perfil"
                  />
                </label>
                <h3>Permissões por módulo</h3>
                <div className="profile-permissions">
                  {modules.map((m) => (
                    <label key={m}>
                      <input
                        type="checkbox"
                        checked={!!permissions[m]}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            [m]: e.target.checked,
                          })
                        }
                      />
                      {m}
                    </label>
                  ))}
                </div>
                <button className="primary">Criar perfil</button>
              </form>
              <h3>Perfis personalizados</h3>
              {profiles.length ? (
                profiles.map((p) => (
                  <div className="document-item" key={p.id}>
                    <b>{p.name}</b>
                    <br />
                    <small>{p.description || "Sem descrição"}</small>
                  </div>
                ))
              ) : (
                <p>Nenhum perfil personalizado cadastrado.</p>
              )}
            </>
          ) : (
            <>
              <p className="eyebrow">{labels[tab][0]}</p>
              <h2>{labels[tab][1]}</h2>
              <p className="project-detail">
                As configurações são salvas conforme seu nível de acesso.
              </p>
              <form
                className="settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessage("Alterações salvas com sucesso.");
                }}
              >
                {basic[tab].map((x) => (
                  <label key={x}>
                    {x}
                    <input />
                  </label>
                ))}
                <button className="primary">Salvar alterações</button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
