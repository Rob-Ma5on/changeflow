import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'Acme Manufacturing Co.',
      domain: 'acme-mfg.com',
    },
  });
  console.log('✓ Created organization:', organization.name);

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme-mfg.com' },
    update: {
      password: hashedPassword,
      organizationId: organization.id,
    },
    create: {
      email: 'admin@acme-mfg.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: organization.id,
    },
  });
  console.log('✓ Created admin user:', adminUser.email);

  // Create engineering users
  const engineer1 = await prisma.user.upsert({
    where: { email: 'john.engineer@acme-mfg.com' },
    update: {
      password: hashedPassword,
      organizationId: organization.id,
    },
    create: {
      email: 'john.engineer@acme-mfg.com',
      name: 'John Engineer',
      password: hashedPassword,
      role: 'ENGINEER',
      organizationId: organization.id,
    },
  });

  const engineer2 = await prisma.user.upsert({
    where: { email: 'sarah.manager@acme-mfg.com' },
    update: {
      password: hashedPassword,
      organizationId: organization.id,
    },
    create: {
      email: 'sarah.manager@acme-mfg.com',
      name: 'Sarah Manager',
      password: hashedPassword,
      role: 'MANAGER',
      organizationId: organization.id,
    },
  });
  console.log('✓ Created engineer users');

  // Create sample ECR
  const ecr1 = await prisma.eCR.upsert({
    where: { id: 'demo-ecr-1' },
    update: {},
    create: {
      id: 'demo-ecr-1',
      ecrNumber: 'ECR-0001',
      title: 'Improve Widget Assembly Process',
      description: 'Current widget assembly process has inefficiencies that result in longer cycle times and potential quality issues.',
      reason: 'Cost reduction and quality improvement initiative',
      urgency: 'HIGH',
      status: 'SUBMITTED',
      organizationId: organization.id,
      submitterId: engineer1.id,
      assigneeId: engineer2.id,
      approverId: adminUser.id,
      submittedAt: new Date('2024-01-15T10:00:00Z'),
      affectedProducts: 'Widget Model A, Widget Model B',
      affectedDocuments: 'Assembly Drawing 001, Work Instruction WI-200',
      costImpact: 15000.00,
      scheduleImpact: '2 weeks implementation timeline',
      implementationPlan: 'Phase 1: Tool redesign, Phase 2: Process validation, Phase 3: Training rollout',
    },
  });

  const ecr2 = await prisma.eCR.upsert({
    where: { id: 'demo-ecr-2' },
    update: {},
    create: {
      id: 'demo-ecr-2',
      ecrNumber: 'ECR-0002',
      title: 'Update Material Specification for Component X',
      description: 'Component X material specification needs update to address supplier change and improve durability.',
      reason: 'Supplier discontinuation and performance enhancement',
      urgency: 'MEDIUM',
      status: 'APPROVED',
      organizationId: organization.id,
      submitterId: engineer2.id,
      assigneeId: engineer1.id,
      approverId: adminUser.id,
      submittedAt: new Date('2024-01-20T14:30:00Z'),
      approvedAt: new Date('2024-01-22T09:15:00Z'),
      affectedProducts: 'Product Line C',
      affectedDocuments: 'Material Spec MS-300, BOM-450',
      costImpact: 8500.00,
      scheduleImpact: '1 week for documentation updates',
      implementationPlan: 'Update specifications, validate with new supplier, update BOMs',
    },
  });
  console.log('✓ Created sample ECRs');

  // Create sample ECO linked to approved ECR
  const eco1 = await prisma.eCO.upsert({
    where: { id: 'demo-eco-1' },
    update: {},
    create: {
      id: 'demo-eco-1',
      ecoNumber: 'ECO-0001',
      title: 'Implement Material Specification Update for Component X',
      description: 'Formal change order to implement the approved material specification changes for Component X.',
      ecrId: ecr2.id,
      organizationId: organization.id,
      submitterId: adminUser.id,
      assigneeId: engineer1.id,
      approverId: adminUser.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      submittedAt: new Date('2024-01-23T08:00:00Z'),
      approvedAt: new Date('2024-01-23T16:00:00Z'),
      targetDate: new Date('2024-02-15T00:00:00Z'),
      implementationPlan: 'Update all material specifications, coordinate with procurement, validate supplier samples',
      testingPlan: 'Perform material qualification testing, durability tests, compatibility verification',
      rollbackPlan: 'Maintain inventory of old materials for 30 days, documented reversion procedure',
      resourcesRequired: 'Materials engineer (40hrs), Lab testing (20hrs), Procurement coordination',
      estimatedEffort: '80 hours total effort',
    },
  });
  console.log('✓ Created sample ECO');

  // Create sample ECN for completed change
  const ecn1 = await prisma.eCN.upsert({
    where: { id: 'demo-ecn-1' },
    update: {},
    create: {
      id: 'demo-ecn-1',
      ecnNumber: 'ECN-0001',
      title: 'Material Specification Update Effective - Component X',
      description: 'Engineering Change Notice: Material specification for Component X has been updated and is now effective.',
      ecoId: eco1.id,
      organizationId: organization.id,
      submitterId: engineer1.id,
      assigneeId: engineer2.id,
      status: 'DISTRIBUTED',
      effectiveDate: new Date('2024-02-01T00:00:00Z'),
      distributedAt: new Date('2024-02-01T08:00:00Z'),
      changesImplemented: 'Material specification MS-300 updated to Rev C, BOM-450 updated to Rev D',
      affectedItems: 'Component X (Part# CX-12345), Product Line C assemblies',
      dispositionInstructions: 'Use existing inventory until depleted, new material effective for all new orders',
      verificationMethod: 'Material certification review, incoming inspection updated per new spec',
    },
  });
  console.log('✓ Created sample ECN');

  console.log('🌱 Seed completed successfully!');
  console.log('');
  console.log('Demo data created:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- Admin User: ${adminUser.email} (password: password123)`);
  console.log(`- Engineers: ${engineer1.name}, ${engineer2.name} (password: password123)`);
  console.log(`- ECRs: ${ecr1.ecrNumber}, ${ecr2.ecrNumber}`);
  console.log(`- ECO: ${eco1.ecoNumber}`);
  console.log(`- ECN: ${ecn1.ecnNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });