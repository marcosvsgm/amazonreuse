# Amazon Reuse — MVP SaaS

Base operacional para o ERP multiempresa de gestão ambiental.

## O que já está estruturado

- Next.js + TypeScript com App Router;
- PostgreSQL + Prisma, com entidades isoladas por `tenantId`;
- autenticação por JWT em cookie `httpOnly`;
- perfis: Super Admin, Consultor, Responsável Técnico, Admin do Cliente, Operador e Participante;
- middleware que protege as rotas;
- API de medições de resíduos com validação, autorização por empresa e trilha de auditoria;
- dashboard para a empresa ativa e menu dos módulos do produto;
- ambiente PostgreSQL local via Docker Compose.

## Executar localmente

```powershell
cd saas-mvp
Copy-Item .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`.

Credenciais demonstrativas: `admin@amazonreuse.com.br` / `AmazonReuse2026!`.

## Segurança multiempresa

O `tenantId` é exigido nas entidades que pertencem a clientes. Rotas de dados usam a sessão para conferir se o usuário é `SUPER_ADMIN` ou pertence ao tenant solicitado. Essa verificação deve ser mantida em toda nova rota antes de consultar ou gravar dados.

## Próximas entregas do MVP

1. CRUDs completos para empresas, unidades, contratos e usuários.
2. Tela de lançamento de pesagens e importação CSV/XLSX.
3. Campanhas, presença via QR Code e formulários de feedback.
4. Upload de documentos para R2/S3, PGRS e geração de PDF.
