import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed with test data for all roles...');

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

  // Create test users for all 8 roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'admin@test.com',
      name: 'Admin Test User',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Administration',
      departmentRole: 'System Administrator',
      organizationId: organization.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'manager@test.com',
      name: 'Manager Test User',
      password: hashedPassword,
      role: 'MANAGER',
      department: 'Engineering',
      departmentRole: 'Engineering Manager',
      organizationId: organization.id,
    },
  });

  const engineerUser = await prisma.user.upsert({
    where: { email: 'engineer@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'engineer@test.com',
      name: 'Engineer Test User',
      password: hashedPassword,
      role: 'ENGINEER',
      department: 'Engineering',
      departmentRole: 'Senior Design Engineer',
      organizationId: organization.id,
    },
  });

  const qualityUser = await prisma.user.upsert({
    where: { email: 'quality@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'quality@test.com',
      name: 'Quality Test User',
      password: hashedPassword,
      role: 'QUALITY',
      department: 'Quality Assurance',
      departmentRole: 'Quality Control Engineer',
      organizationId: organization.id,
    },
  });

  const manufacturingUser = await prisma.user.upsert({
    where: { email: 'manufacturing@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'manufacturing@test.com',
      name: 'Manufacturing Test User',
      password: hashedPassword,
      role: 'MANUFACTURING',
      department: 'Manufacturing',
      departmentRole: 'Manufacturing Engineer',
      organizationId: organization.id,
    },
  });

  const requestorUser = await prisma.user.upsert({
    where: { email: 'requestor@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'requestor@test.com',
      name: 'Requestor Test User',
      password: hashedPassword,
      role: 'REQUESTOR',
      department: 'Operations',
      departmentRole: 'Process Specialist',
      organizationId: organization.id,
    },
  });

  const documentControlUser = await prisma.user.upsert({
    where: { email: 'document@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'document@test.com',
      name: 'Document Control Test User',
      password: hashedPassword,
      role: 'DOCUMENT_CONTROL',
      department: 'Document Control',
      departmentRole: 'Document Controller',
      organizationId: organization.id,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@test.com' },
    update: { password: hashedPassword, organizationId: organization.id },
    create: {
      email: 'viewer@test.com',
      name: 'Viewer Test User',
      password: hashedPassword,
      role: 'VIEWER',
      department: 'External',
      departmentRole: 'Stakeholder',
      organizationId: organization.id,
    },
  });
  console.log('✓ Created all 8 role test users');

  // Create test ECRs in various statuses
  // 2 DRAFT ECRs
  const draftEcr1 = await prisma.eCR.upsert({
    where: { id: 'ecr-draft-1' },
    update: {},
    create: {
      id: 'ecr-draft-1',
      ecrNumber: 'ECR-DRAFT-001',
      title: 'Improve Assembly Line Efficiency',
      description: 'Draft proposal to optimize assembly line layout and reduce cycle time.',
      reason: 'Efficiency improvement',
      priority: 'MEDIUM',
      reasonForChange: 'Process optimization',
      customerImpact: 'INDIRECT_IMPACT',
      status: 'DRAFT',
      organizationId: organization.id,
      submitterId: requestorUser.id,
      assigneeId: engineerUser.id,
      affectedProducts: 'Assembly Line A',
      costImpact: 5000.00,
      estimatedCostRange: 'FROM_1K_TO_10K',
      targetImplementationDate: new Date('2024-06-15T00:00:00Z'),
    },
  });

  const draftEcr2 = await prisma.eCR.upsert({
    where: { id: 'ecr-draft-2' },
    update: {},
    create: {
      id: 'ecr-draft-2',
      ecrNumber: 'ECR-DRAFT-002',
      title: 'New Safety Protocol Implementation',
      description: 'Draft ECR for implementing enhanced safety protocols in manufacturing.',
      reason: 'Safety compliance',
      priority: 'HIGH',
      reasonForChange: 'Regulatory compliance, Safety improvement',
      customerImpact: 'NO_IMPACT',
      status: 'DRAFT',
      organizationId: organization.id,
      submitterId: manufacturingUser.id,
      assigneeId: qualityUser.id,
      affectedProducts: 'All manufacturing processes',
      costImpact: 12000.00,
      estimatedCostRange: 'FROM_10K_TO_50K',
      targetImplementationDate: new Date('2024-08-01T00:00:00Z'),
    },
  });

  // 3 SUBMITTED ECRs
  const submittedEcr1 = await prisma.eCR.upsert({
    where: { id: 'ecr-submitted-1' },
    update: {},
    create: {
      id: 'ecr-submitted-1',
      ecrNumber: 'ECR-2024-001',
      title: 'Widget Assembly Process Improvement',
      description: 'Optimize widget assembly process to reduce cycle time and improve quality.',
      reason: 'Cost reduction and quality improvement',
      priority: 'HIGH',
      reasonForChange: 'Cost reduction, Quality improvement',
      customerImpact: 'INDIRECT_IMPACT',
      status: 'SUBMITTED',
      organizationId: organization.id,
      submitterId: requestorUser.id,
      assigneeId: engineerUser.id,
      approverId: managerUser.id,
      submittedAt: new Date('2024-01-15T10:00:00Z'),
      affectedProducts: 'Widget Model A, Widget Model B',
      affectedDocuments: 'Assembly Drawing 001, Work Instruction WI-200',
      costImpact: 15000.00,
      scheduleImpact: '2 weeks implementation',
      implementationPlan: 'Phase 1: Tool redesign, Phase 2: Validation, Phase 3: Training',
      estimatedCostRange: 'FROM_10K_TO_50K',
      targetImplementationDate: new Date('2024-05-15T00:00:00Z'),
      stakeholders: 'Manufacturing, Quality, Engineering',
    },
  });

  const submittedEcr2 = await prisma.eCR.upsert({
    where: { id: 'ecr-submitted-2' },
    update: {},
    create: {
      id: 'ecr-submitted-2',
      ecrNumber: 'ECR-2024-002',
      title: 'Material Specification Update - Component X',
      description: 'Update material specs for Component X due to supplier change.',
      reason: 'Supplier change and performance enhancement',
      priority: 'MEDIUM',
      reasonForChange: 'Supplier change, Performance enhancement',
      customerImpact: 'DIRECT_IMPACT',
      status: 'SUBMITTED',
      organizationId: organization.id,
      submitterId: engineerUser.id,
      assigneeId: qualityUser.id,
      approverId: managerUser.id,
      submittedAt: new Date('2024-01-20T14:30:00Z'),
      affectedProducts: 'Product Line C',
      affectedDocuments: 'Material Spec MS-300, BOM-450',
      costImpact: 8500.00,
      scheduleImpact: '1 week for documentation',
      implementationPlan: 'Update specs, validate with supplier, update BOMs',
      estimatedCostRange: 'FROM_1K_TO_10K',
      targetImplementationDate: new Date('2024-04-29T00:00:00Z'),
      stakeholders: 'Procurement, Engineering, Quality',
    },
  });

  const submittedEcr3 = await prisma.eCR.upsert({
    where: { id: 'ecr-submitted-3' },
    update: {},
    create: {
      id: 'ecr-submitted-3',
      ecrNumber: 'ECR-2024-003',
      title: 'Quality Control Process Enhancement',
      description: 'Enhance quality control procedures for better defect detection.',
      reason: 'Quality improvement initiative',
      priority: 'MEDIUM',
      reasonForChange: 'Quality improvement, Customer satisfaction',
      customerImpact: 'POSITIVE_IMPACT',
      status: 'SUBMITTED',
      organizationId: organization.id,
      submitterId: qualityUser.id,
      assigneeId: managerUser.id,
      approverId: adminUser.id,
      submittedAt: new Date('2024-01-25T09:00:00Z'),
      affectedProducts: 'All product lines',
      affectedDocuments: 'QC Procedures QCP-100, QCP-200',
      costImpact: 3500.00,
      scheduleImpact: '3 days for training',
      implementationPlan: 'Update procedures, train staff, validate process',
      estimatedCostRange: 'FROM_1K_TO_10K',
      targetImplementationDate: new Date('2024-04-01T00:00:00Z'),
      stakeholders: 'Quality, Manufacturing, Engineering',
    },
  });

  // 2 UNDER_REVIEW ECRs
  const reviewEcr1 = await prisma.eCR.upsert({
    where: { id: 'ecr-review-1' },
    update: {},
    create: {
      id: 'ecr-review-1',
      ecrNumber: 'ECR-2024-004',
      title: 'Packaging Design Optimization',
      description: 'Optimize packaging design to reduce material costs and environmental impact.',
      reason: 'Cost reduction and sustainability',
      priority: 'LOW',
      reasonForChange: 'Cost reduction, Environmental impact',
      customerImpact: 'POSITIVE_IMPACT',
      status: 'UNDER_REVIEW',
      organizationId: organization.id,
      submitterId: requestorUser.id,
      assigneeId: engineerUser.id,
      approverId: managerUser.id,
      submittedAt: new Date('2024-01-10T11:00:00Z'),
      reviewStartedAt: new Date('2024-01-12T08:00:00Z'),
      affectedProducts: 'All packaged products',
      affectedDocuments: 'Packaging Spec PS-100, Environmental Guide EG-200',
      costImpact: 25000.00,
      scheduleImpact: '4 weeks for implementation',
      implementationPlan: 'Design new packaging, test samples, update processes',
      estimatedCostRange: 'FROM_10K_TO_50K',
      targetImplementationDate: new Date('2024-06-01T00:00:00Z'),
      stakeholders: 'Engineering, Manufacturing, Procurement',
    },
  });

  const reviewEcr2 = await prisma.eCR.upsert({
    where: { id: 'ecr-review-2' },
    update: {},
    create: {
      id: 'ecr-review-2',
      ecrNumber: 'ECR-2024-005',
      title: 'Automation System Upgrade',
      description: 'Upgrade automation systems to improve production efficiency.',
      reason: 'Technology upgrade for efficiency',
      priority: 'HIGH',
      reasonForChange: 'Efficiency improvement, Technology upgrade',
      customerImpact: 'INDIRECT_IMPACT',
      status: 'UNDER_REVIEW',
      organizationId: organization.id,
      submitterId: manufacturingUser.id,
      assigneeId: engineerUser.id,
      approverId: adminUser.id,
      submittedAt: new Date('2024-01-08T13:30:00Z'),
      reviewStartedAt: new Date('2024-01-09T09:00:00Z'),
      affectedProducts: 'Automated production lines',
      affectedDocuments: 'System Specs SS-400, Control Logic CL-500',
      costImpact: 75000.00,
      scheduleImpact: '8 weeks for installation and testing',
      implementationPlan: 'Install hardware, configure software, test systems, train operators',
      estimatedCostRange: 'FROM_50K_TO_100K',
      targetImplementationDate: new Date('2024-07-15T00:00:00Z'),
      stakeholders: 'Manufacturing, Engineering, IT, Training',
    },
  });

  // 1 APPROVED ECR
  const approvedEcr = await prisma.eCR.upsert({
    where: { id: 'ecr-approved-1' },
    update: {},
    create: {
      id: 'ecr-approved-1',
      ecrNumber: 'ECR-2024-006',
      title: 'Tool Maintenance Schedule Update',
      description: 'Update tool maintenance schedule to reduce unexpected downtime.',
      reason: 'Preventive maintenance improvement',
      priority: 'MEDIUM',
      reasonForChange: 'Reliability improvement, Cost reduction',
      customerImpact: 'NO_IMPACT',
      status: 'APPROVED',
      organizationId: organization.id,
      submitterId: manufacturingUser.id,
      assigneeId: engineerUser.id,
      approverId: managerUser.id,
      submittedAt: new Date('2023-12-15T10:00:00Z'),
      reviewStartedAt: new Date('2023-12-16T08:00:00Z'),
      approvedAt: new Date('2023-12-20T14:00:00Z'),
      affectedProducts: 'All manufactured products',
      affectedDocuments: 'Maintenance Schedule MS-100, Tool List TL-200',
      costImpact: 2500.00,
      scheduleImpact: '2 days for schedule updates',
      implementationPlan: 'Update schedules, notify teams, implement new procedures',
      estimatedCostRange: 'UNDER_1K',
      targetImplementationDate: new Date('2024-03-01T00:00:00Z'),
      stakeholders: 'Manufacturing, Maintenance, Quality',
    },
  });

  // 1 REJECTED ECR
  const rejectedEcr = await prisma.eCR.upsert({
    where: { id: 'ecr-rejected-1' },
    update: {},
    create: {
      id: 'ecr-rejected-1',
      ecrNumber: 'ECR-2024-007',
      title: 'Premium Material Upgrade',
      description: 'Upgrade to premium materials for enhanced product durability.',
      reason: 'Product enhancement',
      priority: 'LOW',
      reasonForChange: 'Product enhancement, Competitive advantage',
      customerImpact: 'DIRECT_IMPACT',
      status: 'REJECTED',
      organizationId: organization.id,
      submitterId: requestorUser.id,
      assigneeId: engineerUser.id,
      approverId: managerUser.id,
      submittedAt: new Date('2023-12-10T09:00:00Z'),
      reviewStartedAt: new Date('2023-12-11T10:00:00Z'),
      rejectedAt: new Date('2023-12-18T16:00:00Z'),
      rejectionReason: 'Cost-benefit analysis shows insufficient ROI for the proposed material upgrade.',
      affectedProducts: 'Product Line D',
      costImpact: 45000.00,
      estimatedCostRange: 'FROM_10K_TO_50K',
      stakeholders: 'Engineering, Procurement, Finance',
    },
  });
  console.log('✓ Created test ECRs in all statuses');

  // Create test ECOs in various stages
  // ECO from approved ECR
  const eco1 = await prisma.eCO.upsert({
    where: { id: 'eco-planning-1' },
    update: {},
    create: {
      id: 'eco-planning-1',
      ecoNumber: 'ECO-2024-001',
      title: 'Implement Tool Maintenance Schedule Update',
      description: 'Formal change order to implement the approved tool maintenance schedule changes.',
      organizationId: organization.id,
      submitterId: managerUser.id,
      assigneeId: manufacturingUser.id,
      approverId: adminUser.id,
      status: 'PLANNING',
      priority: 'MEDIUM',
      submittedAt: new Date('2023-12-21T08:00:00Z'),
      approvedAt: new Date('2023-12-21T16:00:00Z'),
      targetDate: new Date('2024-03-01T00:00:00Z'),
      implementationPlan: 'Update maintenance schedules, train staff, implement new procedures',
      testingPlan: 'Validate new schedule effectiveness, monitor tool performance',
      rollbackPlan: 'Revert to previous schedule if issues arise',
      resourcesRequired: 'Maintenance team (20hrs), Training (10hrs)',
      estimatedEffort: '30 hours total effort',
      effectiveDate: new Date('2024-03-01T00:00:00Z'),
      effectivityType: 'DATE_BASED',
      materialDisposition: 'USE_AS_IS',
      documentUpdates: 'Maintenance schedules, procedures',
      implementationTeam: 'Manufacturing, Maintenance',
      inventoryImpact: false,
      estimatedTotalCost: 2500.00,
    },
  });

  const eco2 = await prisma.eCO.upsert({
    where: { id: 'eco-execution-1' },
    update: {},
    create: {
      id: 'eco-execution-1',
      ecoNumber: 'ECO-2024-002',
      title: 'Widget Process Improvement Implementation',
      description: 'Implementation of widget assembly process improvements.',
      organizationId: organization.id,
      submitterId: managerUser.id,
      assigneeId: engineerUser.id,
      approverId: adminUser.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      submittedAt: new Date('2024-01-20T08:00:00Z'),
      approvedAt: new Date('2024-01-21T10:00:00Z'),
      startedAt: new Date('2024-01-22T08:00:00Z'),
      targetDate: new Date('2024-04-15T00:00:00Z'),
      implementationPlan: 'Phase 1: Tool redesign, Phase 2: Validation, Phase 3: Training',
      testingPlan: 'Pilot run validation, performance testing, quality verification',
      rollbackPlan: 'Maintain old tooling for 60 days, documented rollback procedure',
      resourcesRequired: 'Engineering (120hrs), Manufacturing (80hrs), Quality (40hrs)',
      estimatedEffort: '240 hours total effort',
      effectiveDate: new Date('2024-04-15T00:00:00Z'),
      effectivityType: 'DATE_BASED',
      materialDisposition: 'REWORK',
      documentUpdates: 'Assembly drawings, work instructions, training materials',
      implementationTeam: 'Engineering, Manufacturing, Quality, Training',
      inventoryImpact: true,
      estimatedTotalCost: 15000.00,
      actualProgress: 35,
    },
  });

  const eco3 = await prisma.eCO.upsert({
    where: { id: 'eco-verification-1' },
    update: {},
    create: {
      id: 'eco-verification-1',
      ecoNumber: 'ECO-2024-003',
      title: 'Safety Protocol Implementation',
      description: 'Implementation of enhanced safety protocols across manufacturing.',
      organizationId: organization.id,
      submitterId: managerUser.id,
      assigneeId: qualityUser.id,
      approverId: adminUser.id,
      status: 'VERIFICATION',
      priority: 'HIGH',
      submittedAt: new Date('2024-01-05T08:00:00Z'),
      approvedAt: new Date('2024-01-06T10:00:00Z'),
      startedAt: new Date('2024-01-08T08:00:00Z'),
      targetDate: new Date('2024-03-15T00:00:00Z'),
      implementationPlan: 'Deploy safety protocols, train personnel, audit compliance',
      testingPlan: 'Safety audit, compliance verification, incident tracking',
      rollbackPlan: 'Emergency procedures in place if safety issues arise',
      resourcesRequired: 'Safety officer (60hrs), Training (100hrs), Auditing (20hrs)',
      estimatedEffort: '180 hours total effort',
      effectiveDate: new Date('2024-03-15T00:00:00Z'),
      effectivityType: 'DATE_BASED',
      materialDisposition: 'USE_AS_IS',
      documentUpdates: 'Safety procedures, training materials, audit checklists',
      implementationTeam: 'Safety, Manufacturing, Quality, HR',
      inventoryImpact: false,
      estimatedTotalCost: 12000.00,
      actualProgress: 85,
    },
  });

  const eco4 = await prisma.eCO.upsert({
    where: { id: 'eco-completed-1' },
    update: {},
    create: {
      id: 'eco-completed-1',
      ecoNumber: 'ECO-2023-015',
      title: 'Quality Inspection Process Update',
      description: 'Updated quality inspection procedures for better defect detection.',
      organizationId: organization.id,
      submitterId: managerUser.id,
      assigneeId: qualityUser.id,
      approverId: adminUser.id,
      status: 'COMPLETED',
      priority: 'MEDIUM',
      submittedAt: new Date('2023-11-15T08:00:00Z'),
      approvedAt: new Date('2023-11-16T10:00:00Z'),
      startedAt: new Date('2023-11-20T08:00:00Z'),
      completedAt: new Date('2023-12-15T16:00:00Z'),
      targetDate: new Date('2023-12-15T00:00:00Z'),
      implementationPlan: 'Update procedures, train inspectors, validate effectiveness',
      testingPlan: 'Performance validation, defect detection rate analysis',
      rollbackPlan: 'Previous procedures documented for emergency use',
      resourcesRequired: 'Quality engineers (40hrs), Training (30hrs)',
      estimatedEffort: '70 hours total effort',
      effectiveDate: new Date('2023-12-15T00:00:00Z'),
      effectivityType: 'DATE_BASED',
      materialDisposition: 'USE_AS_IS',
      documentUpdates: 'Inspection procedures, training materials, quality forms',
      implementationTeam: 'Quality, Training, Manufacturing',
      inventoryImpact: false,
      estimatedTotalCost: 3500.00,
      actualProgress: 100,
    },
  });

  // Link ECRs to ECOs
  await prisma.eCR.update({
    where: { id: approvedEcr.id },
    data: { ecoId: eco1.id },
  });
  console.log('✓ Created test ECOs in various stages');

  // Create test ECNs with various acknowledgment states
  const ecn1 = await prisma.eCN.upsert({
    where: { id: 'ecn-distributed-1' },
    update: {},
    create: {
      id: 'ecn-distributed-1',
      ecnNumber: 'ECN-2023-001',
      title: 'Quality Inspection Process Update Effective',
      description: 'Engineering Change Notice: Quality inspection procedures have been updated and are now effective.',
      ecoId: eco4.id,
      organizationId: organization.id,
      submitterId: qualityUser.id,
      assigneeId: documentControlUser.id,
      status: 'DISTRIBUTED',
      effectiveDate: new Date('2023-12-15T00:00:00Z'),
      distributedAt: new Date('2023-12-15T08:00:00Z'),
      changesImplemented: 'Quality procedures QP-100 updated to Rev B, inspection forms updated',
      affectedItems: 'All manufactured products, Quality inspection stations',
      dispositionInstructions: 'New procedures effective immediately, old forms to be discarded',
      verificationMethod: 'Quality audit verification, inspector certification review',
      distributionList: 'quality@test.com, manufacturing@test.com, manager@test.com',
      internalStakeholders: 'Quality Team, Manufacturing, Management',
      customerNotificationRequired: 'INFORMATIONAL',
      responseDeadline: 'DAYS_7',
      implementationStatus: 'COMPLETE',
      actualImplementationDate: new Date('2023-12-15T00:00:00Z'),
      acknowledgmentStatus: 'Partially Acknowledged',
      finalDocumentationSummary: 'Quality procedures updated and distributed. Training completed.',
      closureApprover: 'Quality Manager',
    },
  });

  const ecn2 = await prisma.eCN.upsert({
    where: { id: 'ecn-pending-1' },
    update: {},
    create: {
      id: 'ecn-pending-1',
      ecnNumber: 'ECN-2024-001',
      title: 'Safety Protocol Implementation Notice',
      description: 'Engineering Change Notice: Enhanced safety protocols are being implemented.',
      ecoId: eco3.id,
      organizationId: organization.id,
      submitterId: qualityUser.id,
      assigneeId: documentControlUser.id,
      status: 'PENDING_DISTRIBUTION',
      effectiveDate: new Date('2024-03-15T00:00:00Z'),
      changesImplemented: 'Safety procedures SP-200 created, training materials developed',
      affectedItems: 'All manufacturing processes, Safety equipment',
      dispositionInstructions: 'New safety protocols to be followed effective date forward',
      verificationMethod: 'Safety compliance audit, training completion verification',
      distributionList: 'manufacturing@test.com, quality@test.com, admin@test.com',
      internalStakeholders: 'Manufacturing, Quality, Safety, HR',
      customerNotificationRequired: 'NOT_REQUIRED',
      responseDeadline: 'DAYS_5',
      implementationStatus: 'IN_PROGRESS',
      acknowledgmentStatus: 'Pending',
      finalDocumentationSummary: 'Safety protocols ready for implementation.',
      closureApprover: 'Safety Manager',
    },
  });

  const ecn3 = await prisma.eCN.upsert({
    where: { id: 'ecn-acknowledged-1' },
    update: {},
    create: {
      id: 'ecn-acknowledged-1',
      ecnNumber: 'ECN-2023-012',
      title: 'Tool Maintenance Schedule Change Complete',
      description: 'Engineering Change Notice: Tool maintenance schedules have been updated per ECO-2023-010.',
      organizationId: organization.id,
      submitterId: manufacturingUser.id,
      assigneeId: documentControlUser.id,
      status: 'ACKNOWLEDGED',
      effectiveDate: new Date('2023-11-01T00:00:00Z'),
      distributedAt: new Date('2023-10-25T08:00:00Z'),
      changesImplemented: 'Maintenance schedules MS-100 updated, tool tracking system updated',
      affectedItems: 'All production tools, Maintenance schedules',
      dispositionInstructions: 'New maintenance intervals effective November 1st',
      verificationMethod: 'Maintenance log review, tool performance tracking',
      distributionList: 'manufacturing@test.com, requestor@test.com, manager@test.com',
      internalStakeholders: 'Manufacturing, Maintenance, Management',
      customerNotificationRequired: 'NOT_REQUIRED',
      responseDeadline: 'DAYS_3',
      implementationStatus: 'COMPLETE',
      actualImplementationDate: new Date('2023-11-01T00:00:00Z'),
      acknowledgmentStatus: 'Fully Acknowledged',
      finalDocumentationSummary: 'Maintenance schedules updated successfully. All teams notified.',
      closureApprover: 'Manufacturing Manager',
    },
  });

  const ecn4 = await prisma.eCN.upsert({
    where: { id: 'ecn-overdue-1' },
    update: {},
    create: {
      id: 'ecn-overdue-1',
      ecnNumber: 'ECN-2024-002',
      title: 'Widget Process Change - Response Overdue',
      description: 'Engineering Change Notice: Widget assembly process changes require immediate attention.',
      ecoId: eco2.id,
      organizationId: organization.id,
      submitterId: engineerUser.id,
      assigneeId: documentControlUser.id,
      status: 'DISTRIBUTED',
      effectiveDate: new Date('2024-02-15T00:00:00Z'),
      distributedAt: new Date('2024-01-25T08:00:00Z'),
      changesImplemented: 'Assembly procedures AP-300 updated, tooling specifications changed',
      affectedItems: 'Widget Model A, Widget Model B, Assembly stations',
      dispositionInstructions: 'New assembly procedures effective February 15th',
      verificationMethod: 'Assembly line validation, quality check verification',
      distributionList: 'manufacturing@test.com, quality@test.com, requestor@test.com',
      internalStakeholders: 'Manufacturing, Quality, Engineering',
      customerNotificationRequired: 'REQUIRED',
      responseDeadline: 'DAYS_7',
      implementationStatus: 'PENDING',
      acknowledgmentStatus: 'Overdue Responses',
      finalDocumentationSummary: 'Widget process changes documented. Awaiting manufacturing confirmation.',
      closureApprover: 'Engineering Manager',
    },
  });
  console.log('✓ Created test ECNs with various acknowledgment states');

  console.log('🌱 Comprehensive seed completed successfully!');
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
  console.log(`  • Document Control: ${documentControlUser.email}`);
  console.log(`  • Viewer: ${viewerUser.email}`);
  console.log('- ECRs created:');
  console.log(`  • ${draftEcr1.ecrNumber} (DRAFT)`);
  console.log(`  • ${draftEcr2.ecrNumber} (DRAFT)`);
  console.log(`  • ${submittedEcr1.ecrNumber} (SUBMITTED)`);
  console.log(`  • ${submittedEcr2.ecrNumber} (SUBMITTED)`);
  console.log(`  • ${submittedEcr3.ecrNumber} (SUBMITTED)`);
  console.log(`  • ${reviewEcr1.ecrNumber} (UNDER_REVIEW)`);
  console.log(`  • ${reviewEcr2.ecrNumber} (UNDER_REVIEW)`);
  console.log(`  • ${approvedEcr.ecrNumber} (APPROVED)`);
  console.log(`  • ${rejectedEcr.ecrNumber} (REJECTED)`);
  console.log('- ECOs created:');
  console.log(`  • ${eco1.ecoNumber} (PLANNING)`);
  console.log(`  • ${eco2.ecoNumber} (IN_PROGRESS)`);
  console.log(`  • ${eco3.ecoNumber} (VERIFICATION)`);
  console.log(`  • ${eco4.ecoNumber} (COMPLETED)`);
  console.log('- ECNs created:');
  console.log(`  • ${ecn1.ecnNumber} (DISTRIBUTED - Partially Acknowledged)`);
  console.log(`  • ${ecn2.ecnNumber} (PENDING_DISTRIBUTION)`);
  console.log(`  • ${ecn3.ecnNumber} (ACKNOWLEDGED - Fully Acknowledged)`);
  console.log(`  • ${ecn4.ecnNumber} (DISTRIBUTED - Overdue Responses)`);
  console.log('');
  console.log('✨ Ready for comprehensive workflow testing!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });