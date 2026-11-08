import { PrismaClient, Role, WasteSource } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('AmazonReuse2026!', 12);
  const amazon = await prisma.tenant.upsert({ where:{slug:'amazon-reuse'}, update:{}, create:{name:'Amazon Reuse',slug:'amazon-reuse'} });
  const senai = await prisma.tenant.upsert({ where:{slug:'senai-demo'}, update:{}, create:{name:'SENAI',slug:'senai-demo'} });
  const unit = await prisma.unit.upsert({where:{tenantId_name:{tenantId:senai.id,name:'SENAI - Unidade Centro'}},update:{},create:{tenantId:senai.id,name:'SENAI - Unidade Centro'}});
  await prisma.user.upsert({where:{email:'admin@amazonreuse.com.br'},update:{},create:{name:'Admin Amazon Reuse',email:'admin@amazonreuse.com.br',passwordHash:hash,role:Role.SUPER_ADMIN,tenantId:amazon.id}});
  const operator = await prisma.user.upsert({where:{email:'gestor@senai.edu.br'},update:{},create:{name:'Gestor SENAI',email:'gestor@senai.edu.br',passwordHash:hash,role:Role.CLIENT_ADMIN,tenantId:senai.id}});
  if (!await prisma.wasteMeasurement.count({where:{tenantId:senai.id}})) await prisma.wasteMeasurement.createMany({data:[{tenantId:senai.id,unitId:unit.id,wasteType:'Lixo comum',classification:'Classe II',weightKg:105.1,source:WasteSource.ESTIMATED,measuredAt:new Date('2026-10-01'),createdById:operator.id},{tenantId:senai.id,unitId:unit.id,wasteType:'Orgânicos',classification:'Classe II',weightKg:51.1,source:WasteSource.ESTIMATED,measuredAt:new Date('2026-10-01'),createdById:operator.id}]});
}
main().finally(()=>prisma.$disconnect());
