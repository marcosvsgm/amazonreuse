INSERT OR IGNORE INTO "Tenant" ("id", "name", "slug") VALUES
  ('tenant_amazon_reuse', 'Amazon Reuse', 'amazon-reuse'),
  ('tenant_senai_demo', 'SENAI', 'senai-demo');

INSERT OR IGNORE INTO "Unit" ("id", "name", "tenantId") VALUES
  ('unit_senai_centro', 'SENAI - Unidade Centro', 'tenant_senai_demo');

INSERT OR IGNORE INTO "User" ("id", "name", "email", "passwordHash", "role", "tenantId") VALUES
  ('user_admin_amazon', 'Admin Amazon Reuse', 'admin@amazonreuse.com.br', '$2b$12$dgBr61zzFQOAvagSv1.Qu.rDHnzWxIp5WO0Y6wQ9Le.b1ndgewavq', 'SUPER_ADMIN', 'tenant_amazon_reuse'),
  ('user_gestor_senai', 'Gestor SENAI', 'gestor@senai.edu.br', '$2b$12$dgBr61zzFQOAvagSv1.Qu.rDHnzWxIp5WO0Y6wQ9Le.b1ndgewavq', 'CLIENT_ADMIN', 'tenant_senai_demo');

INSERT OR IGNORE INTO "WasteMeasurement" ("id", "tenantId", "unitId", "wasteType", "classification", "weightKg", "source", "measuredAt", "createdById") VALUES
  ('measurement_senai_001', 'tenant_senai_demo', 'unit_senai_centro', 'Lixo comum', 'Classe II', 105.1, 'ESTIMATED', '2026-10-01T00:00:00.000Z', 'user_gestor_senai'),
  ('measurement_senai_002', 'tenant_senai_demo', 'unit_senai_centro', 'Orgânicos', 'Classe II', 51.1, 'ESTIMATED', '2026-10-01T00:00:00.000Z', 'user_gestor_senai');
