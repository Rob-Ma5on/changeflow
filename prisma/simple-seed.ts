import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple seed with basic test data...');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'ChangeFlow Test Industries',
      domain: 'test.changeflow.com',
    },
  });
  console.log('✓ Created organization:', organization.name);

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create basic admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'admin@test.com',
      name: 'Admin Test User',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: organization.id,
    },
  });

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'manager@test.com',
      name: 'Manager Test User',
      password: hashedPassword,
      role: 'MANAGER',
      organizationId: organization.id,
    },
  });

  // Create engineer user
  const engineerUser = await prisma.user.upsert({
    where: { email: 'engineer@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'engineer@test.com',
      name: 'Engineer Test User',
      password: hashedPassword,
      role: 'ENGINEER',
      organizationId: organization.id,
    },
  });

  // Create quality user
  const qualityUser = await prisma.user.upsert({
    where: { email: 'quality@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'quality@test.com',
      name: 'Quality Test User',
      password: hashedPassword,
      role: 'QUALITY',
      organizationId: organization.id,
    },
  });

  // Create manufacturing user
  const manufacturingUser = await prisma.user.upsert({
    where: { email: 'manufacturing@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'manufacturing@test.com',
      name: 'Manufacturing Test User',
      password: hashedPassword,
      role: 'MANUFACTURING',
      organizationId: organization.id,
    },
  });

  // Create requestor user
  const requestorUser = await prisma.user.upsert({
    where: { email: 'requestor@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'requestor@test.com',
      name: 'Requestor Test User',
      password: hashedPassword,
      role: 'REQUESTOR',
      organizationId: organization.id,
    },
  });

  // Create document control user
  const documentUser = await prisma.user.upsert({
    where: { email: 'document@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'document@test.com',
      name: 'Document Control Test User',
      password: hashedPassword,
      role: 'DOCUMENT_CONTROL',
      organizationId: organization.id,
    },
  });

  // Create viewer user
  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'viewer@test.com',
      name: 'Viewer Test User',
      password: hashedPassword,
      role: 'VIEWER',
      organizationId: organization.id,
    },
  });
  console.log('✓ Created all test users for different roles');

  // Create a simple test ECR
  const testEcr = await prisma.eCR.upsert({
    where: { id: 'simple-ecr-1' },
    update: {},
    create: {
      id: 'simple-ecr-1',
      ecrNumber: 'ECR-TEST-001',
      title: 'Simple Test ECR',
      description: 'This is a basic test ECR for development.',
      reason: 'Testing purposes',
      priority: 'MEDIUM',
      reasonForChange: 'Testing',
      customerImpact: 'NO_IMPACT',
      status: 'SUBMITTED',
      organizationId: organization.id,
      submitterId: requestorUser.id,
      assigneeId: engineerUser.id,
      approverId: managerUser.id,
      submittedAt: new Date(),
      affectedProducts: 'Test Products',
      costImpact: 5000.00,
      estimatedCostRange: 'FROM_1K_TO_10K',
      targetImplementationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✓ Created test ECR:', testEcr.ecrNumber);

  console.log('🌱 Simple seed completed successfully!');
  console.log('');
  console.log('Test data created:');
  console.log(`- Organization: ${organization.name}`);
  console.log('- Test Users (password: password123):');
  console.log(`  • Admin: ${adminUser.email}`);
  console.log(`  • Manager: ${managerUser.email}`);
  console.log(`  • Engineer: ${engineerUser.email}`);
  console.log(`  • Quality: ${qualityUser.email}`);
  console.log(`  • Manufacturing: ${manufacturingUser.email}`);
  console.log(`  • Requestor: ${requestorUser.email}`);
  console.log(`  • Document Control: ${documentUser.email}`);
  console.log(`  • Viewer: ${viewerUser.email}`);
  console.log(`- Test ECR: ${testEcr.ecrNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });