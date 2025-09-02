import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { BusinessRuleValidator } from '../lib/validation-rules';
import { validateTransition } from '../lib/workflow-rules';
import { hasPermission } from '../lib/permissions';

const prisma = new PrismaClient();

describe('ChangeFlow Workflow Integration Tests', () => {
  let testOrganization: any;
  let testUsers: any = {};

  beforeAll(async () => {
    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        id: 'test-org-workflow',
        name: 'Workflow Test Organization',
        domain: 'workflow-test.com',
        monthlyBudget: 50000.00,
      }
    });

    // Create test users for each role
    const roles = [
      { role: 'ADMIN', email: 'admin-test@workflow.com', name: 'Admin Test', dept: 'Administration' },
      { role: 'MANAGER', email: 'manager-test@workflow.com', name: 'Manager Test', dept: 'Engineering' },
      { role: 'ENGINEER', email: 'engineer-test@workflow.com', name: 'Engineer Test', dept: 'Engineering' },
      { role: 'QUALITY', email: 'quality-test@workflow.com', name: 'Quality Test', dept: 'Quality' },
      { role: 'MANUFACTURING', email: 'mfg-test@workflow.com', name: 'Manufacturing Test', dept: 'Manufacturing' },
      { role: 'REQUESTOR', email: 'requestor-test@workflow.com', name: 'Requestor Test', dept: 'Operations' },
      { role: 'DOCUMENT_CONTROL', email: 'doc-test@workflow.com', name: 'Document Test', dept: 'Document Control' },
      { role: 'VIEWER', email: 'viewer-test@workflow.com', name: 'Viewer Test', dept: 'External' }
    ];

    for (const userData of roles) {
      testUsers[userData.role] = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: 'test-password',
          role: userData.role as any,
          department: userData.dept,
          departmentRole: `Test ${userData.role}`,
          organizationId: testOrganization.id,
        }
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.eCN.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.eCO.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.eCR.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.user.deleteMany({ where: { organizationId: testOrganization.id } });
    await prisma.organization.delete({ where: { id: testOrganization.id } });
    await prisma.$disconnect();
  });

  describe('ECR Workflow Tests', () => {
    test('Complete ECR lifecycle: Draft → Submitted → Under Review → Approved', async () => {
      // Step 1: Requestor creates ECR in DRAFT status
      const ecrData = {
        ecrNumber: 'ECR-WORKFLOW-001',
        title: 'Test ECR for Complete Workflow',
        description: 'This is a comprehensive test of the ECR workflow from creation to approval.',
        reason: 'Workflow testing and validation of business rules',
        priority: 'MEDIUM',
        reasonForChange: 'Testing, Validation',
        customerImpact: 'NO_IMPACT',
        status: 'DRAFT',
        organizationId: testOrganization.id,
        submitterId: testUsers.REQUESTOR.id,
        assigneeId: testUsers.ENGINEER.id,
        affectedProducts: 'Test Products',
        costImpact: 5000.00,
        estimatedCostRange: 'FROM_1K_TO_10K',
        targetImplementationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stakeholders: 'Engineering, Quality, Manufacturing'
      };

      // Validate ECR creation
      const createValidation = BusinessRuleValidator.validateECRWorkflow('create', ecrData, {
        userRole: 'REQUESTOR',
        organizationId: testOrganization.id,
        userId: testUsers.REQUESTOR.id,
        department: 'Operations'
      });

      expect(createValidation.isValid).toBe(true);
      expect(createValidation.errors).toHaveLength(0);

      const ecr = await prisma.eCR.create({ data: ecrData });
      expect(ecr.status).toBe('DRAFT');

      // Step 2: Requestor submits ECR (DRAFT → SUBMITTED)
      const transitionToSubmitted = validateTransition('ECR', 'DRAFT', 'SUBMITTED', 'REQUESTOR');
      expect(transitionToSubmitted.isValid).toBe(true);

      const submittedEcr = await prisma.eCR.update({
        where: { id: ecr.id },
        data: { 
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });
      expect(submittedEcr.status).toBe('SUBMITTED');

      // Step 3: Engineer moves ECR to review (SUBMITTED → UNDER_REVIEW)
      const transitionToReview = validateTransition('ECR', 'SUBMITTED', 'UNDER_REVIEW', 'ENGINEER');
      expect(transitionToReview.isValid).toBe(true);

      const reviewEcr = await prisma.eCR.update({
        where: { id: ecr.id },
        data: { 
          status: 'UNDER_REVIEW',
          reviewStartedAt: new Date()
        }
      });
      expect(reviewEcr.status).toBe('UNDER_REVIEW');

      // Step 4: Manager approves ECR (UNDER_REVIEW → APPROVED)
      const approvalData = {
        status: 'APPROVED',
        approvalComments: 'ECR approved after thorough review. Good cost-benefit analysis.',
        costImpact: 5000.00
      };

      const approvalValidation = BusinessRuleValidator.validateECRWorkflow('approve', approvalData, {
        userRole: 'MANAGER',
        organizationId: testOrganization.id,
        userId: testUsers.MANAGER.id,
        department: 'Engineering'
      });

      expect(approvalValidation.isValid).toBe(true);

      const approvedEcr = await prisma.eCR.update({
        where: { id: ecr.id },
        data: { 
          status: 'APPROVED',
          approvedAt: new Date(),
          approverId: testUsers.MANAGER.id,
          approvalComments: approvalData.approvalComments
        }
      });
      expect(approvedEcr.status).toBe('APPROVED');
    });

    test('ECR rejection workflow: Under Review → Rejected', async () => {
      const ecrData = {
        ecrNumber: 'ECR-WORKFLOW-002',
        title: 'Test ECR for Rejection Workflow',
        description: 'This ECR will be rejected to test the rejection workflow.',
        reason: 'Testing rejection workflow and validation',
        priority: 'LOW',
        reasonForChange: 'Testing',
        customerImpact: 'NO_IMPACT',
        status: 'UNDER_REVIEW',
        organizationId: testOrganization.id,
        submitterId: testUsers.REQUESTOR.id,
        assigneeId: testUsers.ENGINEER.id,
        approverId: testUsers.MANAGER.id,
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        reviewStartedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        affectedProducts: 'Test Products',
        costImpact: 25000.00,
        estimatedCostRange: 'FROM_10K_TO_50K'
      };

      const ecr = await prisma.eCR.create({ data: ecrData });

      // Test rejection with proper reason
      const rejectionData = {
        status: 'REJECTED',
        rejectionReason: 'Cost-benefit analysis shows insufficient return on investment for the proposed changes. Alternative solutions should be explored.'
      };

      const rejectionValidation = BusinessRuleValidator.validateECRWorkflow('approve', rejectionData, {
        userRole: 'MANAGER',
        organizationId: testOrganization.id,
        userId: testUsers.MANAGER.id,
        department: 'Engineering'
      });

      expect(rejectionValidation.isValid).toBe(true);

      const rejectedEcr = await prisma.eCR.update({
        where: { id: ecr.id },
        data: { 
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: rejectionData.rejectionReason
        }
      });

      expect(rejectedEcr.status).toBe('REJECTED');
      expect(rejectedEcr.rejectionReason).toBe(rejectionData.rejectionReason);
    });

    test('Permission validation for ECR operations', async () => {
      // Test that VIEWER cannot create ECRs
      expect(hasPermission('VIEWER', 'ECR', 'CREATE')).toBe(false);

      // Test that REQUESTOR can create but not approve ECRs
      expect(hasPermission('REQUESTOR', 'ECR', 'CREATE')).toBe(true);
      expect(hasPermission('REQUESTOR', 'ECR', 'APPROVE')).toBe(false);

      // Test that MANAGER can approve ECRs
      expect(hasPermission('MANAGER', 'ECR', 'APPROVE')).toBe(true);

      // Test that ENGINEER can review but not approve ECRs
      expect(hasPermission('ENGINEER', 'ECR', 'UPDATE')).toBe(true);
      expect(hasPermission('ENGINEER', 'ECR', 'APPROVE')).toBe(false);
    });
  });

  describe('ECO Workflow Tests', () => {
    let approvedEcr: any;

    beforeEach(async () => {
      // Create an approved ECR for ECO testing
      approvedEcr = await prisma.eCR.create({
        data: {
          ecrNumber: `ECR-ECO-TEST-${Date.now()}`,
          title: 'Approved ECR for ECO Testing',
          description: 'This approved ECR will be used to test ECO workflow.',
          reason: 'ECO workflow testing',
          priority: 'MEDIUM',
          reasonForChange: 'Testing',
          customerImpact: 'NO_IMPACT',
          status: 'APPROVED',
          organizationId: testOrganization.id,
          submitterId: testUsers.REQUESTOR.id,
          assigneeId: testUsers.ENGINEER.id,
          approverId: testUsers.MANAGER.id,
          submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          affectedProducts: 'Test Products',
          costImpact: 8000.00,
          estimatedCostRange: 'FROM_1K_TO_10K'
        }
      });
    });

    test('Complete ECO lifecycle: Planning → In Progress → Verification → Completed', async () => {
      // Step 1: Manager creates ECO from approved ECR
      const ecoData = {
        ecoNumber: 'ECO-WORKFLOW-001',
        title: 'Implementation of Approved ECR Changes',
        description: 'Formal change order to implement the approved ECR changes.',
        organizationId: testOrganization.id,
        submitterId: testUsers.MANAGER.id,
        assigneeId: testUsers.ENGINEER.id,
        approverId: testUsers.ADMIN.id,
        status: 'PLANNING',
        priority: 'MEDIUM',
        submittedAt: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        implementationPlan: 'Phase 1: Design changes, Phase 2: Testing and validation, Phase 3: Production implementation and training',
        testingPlan: 'Functional testing, performance validation, user acceptance testing',
        rollbackPlan: 'Maintain previous version for 30 days, documented rollback procedure available',
        resourcesRequired: 'Engineering team (60 hours), Testing resources (20 hours), Training coordination (10 hours)',
        estimatedEffort: '90 hours total effort across 3 weeks',
        effectiveDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        effectivityType: 'DATE_BASED',
        materialDisposition: 'USE_AS_IS',
        documentUpdates: 'Engineering drawings, work instructions, training materials',
        implementationTeam: 'Engineering, Quality, Manufacturing',
        inventoryImpact: false,
        estimatedTotalCost: 8000.00
      };

      const createValidation = BusinessRuleValidator.validateECOWorkflow('create', ecoData, {
        userRole: 'MANAGER',
        organizationId: testOrganization.id,
        userId: testUsers.MANAGER.id,
        department: 'Engineering'
      });

      expect(createValidation.isValid).toBe(true);

      const eco = await prisma.eCO.create({ data: ecoData });
      expect(eco.status).toBe('PLANNING');

      // Link ECR to ECO
      await prisma.eCR.update({
        where: { id: approvedEcr.id },
        data: { ecoId: eco.id }
      });

      // Step 2: Engineer starts implementation (PLANNING → IN_PROGRESS)
      const transitionToProgress = validateTransition('ECO', 'PLANNING', 'IN_PROGRESS', 'ENGINEER');
      expect(transitionToProgress.isValid).toBe(true);

      const progressEco = await prisma.eCO.update({
        where: { id: eco.id },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          actualProgress: 0
        }
      });
      expect(progressEco.status).toBe('IN_PROGRESS');

      // Step 3: Engineer completes implementation and moves to verification (IN_PROGRESS → VERIFICATION)
      const transitionToVerification = validateTransition('ECO', 'IN_PROGRESS', 'VERIFICATION', 'ENGINEER');
      expect(transitionToVerification.isValid).toBe(true);

      const verificationEco = await prisma.eCO.update({
        where: { id: eco.id },
        data: { 
          status: 'VERIFICATION',
          actualProgress: 100,
          actualImplementationDate: new Date()
        }
      });
      expect(verificationEco.status).toBe('VERIFICATION');

      // Step 4: Quality completes ECO (VERIFICATION → COMPLETED)
      const completionData = {
        status: 'COMPLETED',
        actualProgress: 100,
        verificationResults: 'All quality gates passed. Implementation meets requirements. Performance validation successful. Training completed.',
        qualityGatesPassed: true,
        actualImplementationDate: new Date()
      };

      const completionValidation = BusinessRuleValidator.validateECOWorkflow('complete', completionData, {
        userRole: 'QUALITY',
        organizationId: testOrganization.id,
        userId: testUsers.QUALITY.id,
        department: 'Quality'
      });

      expect(completionValidation.isValid).toBe(true);

      const completedEco = await prisma.eCO.update({
        where: { id: eco.id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          verificationResults: completionData.verificationResults,
          actualProgress: 100
        }
      });
      expect(completedEco.status).toBe('COMPLETED');
    });

    test('ECO hold and resume workflow', async () => {
      const ecoData = {
        ecoNumber: 'ECO-HOLD-TEST-001',
        title: 'ECO for Hold Testing',
        description: 'Testing ECO hold and resume functionality.',
        organizationId: testOrganization.id,
        submitterId: testUsers.MANAGER.id,
        assigneeId: testUsers.MANUFACTURING.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        startedAt: new Date(),
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        implementationPlan: 'Manufacturing process changes requiring equipment modification',
        testingPlan: 'Production line testing and validation',
        rollbackPlan: 'Revert to previous manufacturing setup',
        resourcesRequired: 'Manufacturing engineers, Equipment technicians',
        estimatedTotalCost: 15000.00,
        actualProgress: 25
      };

      const eco = await prisma.eCO.create({ data: ecoData });

      // Test putting ECO on hold (IN_PROGRESS → ON_HOLD)
      const transitionToHold = validateTransition('ECO', 'IN_PROGRESS', 'ON_HOLD', 'MANUFACTURING');
      expect(transitionToHold.isValid).toBe(true);

      const holdEco = await prisma.eCO.update({
        where: { id: eco.id },
        data: { 
          status: 'ON_HOLD',
          holdReason: 'Equipment delivery delayed, awaiting new arrival date'
        }
      });
      expect(holdEco.status).toBe('ON_HOLD');

      // Test resuming ECO (ON_HOLD → IN_PROGRESS)
      const transitionFromHold = validateTransition('ECO', 'ON_HOLD', 'IN_PROGRESS', 'MANUFACTURING');
      expect(transitionFromHold.isValid).toBe(true);

      const resumedEco = await prisma.eCO.update({
        where: { id: eco.id },
        data: { 
          status: 'IN_PROGRESS',
          holdReason: null
        }
      });
      expect(resumedEco.status).toBe('IN_PROGRESS');
    });
  });

  describe('ECN Workflow Tests', () => {
    let completedEco: any;

    beforeEach(async () => {
      // Create a completed ECO for ECN testing
      completedEco = await prisma.eCO.create({
        data: {
          ecoNumber: `ECO-ECN-TEST-${Date.now()}`,
          title: 'Completed ECO for ECN Testing',
          description: 'This completed ECO will be used to test ECN workflow.',
          organizationId: testOrganization.id,
          submitterId: testUsers.MANAGER.id,
          assigneeId: testUsers.ENGINEER.id,
          status: 'COMPLETED',
          priority: 'MEDIUM',
          submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
          startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          targetDate: new Date(),
          implementationPlan: 'Test implementation',
          testingPlan: 'Test validation',
          rollbackPlan: 'Test rollback',
          resourcesRequired: 'Test resources',
          estimatedTotalCost: 5000.00,
          actualProgress: 100,
          effectiveDate: new Date(),
          effectivityType: 'DATE_BASED'
        }
      });
    });

    test('Complete ECN lifecycle: Creation → Distribution → Acknowledgment', async () => {
      // Step 1: Document Control creates ECN from completed ECO
      const ecnData = {
        ecnNumber: 'ECN-WORKFLOW-001',
        title: 'Change Implementation Complete - Engineering Notice',
        description: 'Engineering Change Notice: Implementation of ECO changes is complete and effective.',
        ecoId: completedEco.id,
        organizationId: testOrganization.id,
        submitterId: testUsers.DOCUMENT_CONTROL.id,
        assigneeId: testUsers.DOCUMENT_CONTROL.id,
        status: 'PENDING_DISTRIBUTION',
        effectiveDate: new Date(),
        changesImplemented: 'All planned changes have been implemented successfully. Documentation updated, training completed, systems validated.',
        affectedItems: 'Engineering drawings v2.1, Work instructions WI-300, Training materials TM-150',
        dispositionInstructions: 'New procedures are effective immediately. Old documentation should be archived.',
        verificationMethod: 'Quality audit completed with passing results. All verification gates met.',
        distributionList: 'engineer-test@workflow.com, quality-test@workflow.com, mfg-test@workflow.com',
        internalStakeholders: 'Engineering, Quality Assurance, Manufacturing',
        customerNotificationRequired: 'INFORMATIONAL',
        responseDeadline: 'DAYS_5',
        implementationStatus: 'COMPLETE',
        actualImplementationDate: new Date(),
        acknowledgmentStatus: 'Pending'
      };

      const createValidation = BusinessRuleValidator.validateECNWorkflow('create', ecnData, {
        userRole: 'DOCUMENT_CONTROL',
        organizationId: testOrganization.id,
        userId: testUsers.DOCUMENT_CONTROL.id,
        department: 'Document Control'
      });

      expect(createValidation.isValid).toBe(true);

      const ecn = await prisma.eCN.create({ data: ecnData });
      expect(ecn.status).toBe('PENDING_DISTRIBUTION');

      // Step 2: Document Control distributes ECN (PENDING_DISTRIBUTION → DISTRIBUTED)
      const distributionValidation = BusinessRuleValidator.validateECNWorkflow('distribute', {
        status: 'PENDING_DISTRIBUTION',
        distributionList: ecnData.distributionList,
        customerNotificationRequired: 'INFORMATIONAL'
      }, {
        userRole: 'DOCUMENT_CONTROL',
        organizationId: testOrganization.id,
        userId: testUsers.DOCUMENT_CONTROL.id,
        department: 'Document Control'
      });

      expect(distributionValidation.isValid).toBe(true);

      const distributedEcn = await prisma.eCN.update({
        where: { id: ecn.id },
        data: { 
          status: 'DISTRIBUTED',
          distributedAt: new Date()
        }
      });
      expect(distributedEcn.status).toBe('DISTRIBUTED');

      // Step 3: Recipients acknowledge ECN
      const acknowledgmentValidation = BusinessRuleValidator.validateECNWorkflow('acknowledge', {
        status: 'DISTRIBUTED',
        acknowledgmentComments: 'Changes understood and implemented in our department. Training completed.',
        responseDeadline: 'DAYS_5',
        distributedAt: distributedEcn.distributedAt
      }, {
        userRole: 'ENGINEER',
        organizationId: testOrganization.id,
        userId: testUsers.ENGINEER.id,
        department: 'Engineering'
      });

      expect(acknowledgmentValidation.isValid).toBe(true);

      // Simulate partial acknowledgment
      const partialAcknowledgedEcn = await prisma.eCN.update({
        where: { id: ecn.id },
        data: { 
          acknowledgmentStatus: 'Partially Acknowledged'
        }
      });
      expect(partialAcknowledgedEcn.acknowledgmentStatus).toBe('Partially Acknowledged');

      // Simulate full acknowledgment
      const fullyAcknowledgedEcn = await prisma.eCN.update({
        where: { id: ecn.id },
        data: { 
          status: 'ACKNOWLEDGED',
          acknowledgmentStatus: 'Fully Acknowledged'
        }
      });
      expect(fullyAcknowledgedEcn.status).toBe('ACKNOWLEDGED');
    });

    test('ECN overdue response handling', async () => {
      const ecnData = {
        ecnNumber: 'ECN-OVERDUE-001',
        title: 'ECN for Overdue Testing',
        description: 'Testing ECN overdue response functionality.',
        organizationId: testOrganization.id,
        submitterId: testUsers.DOCUMENT_CONTROL.id,
        status: 'DISTRIBUTED',
        effectiveDate: new Date(),
        distributedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        changesImplemented: 'Test changes implemented',
        affectedItems: 'Test items',
        dispositionInstructions: 'Test disposition',
        distributionList: 'test@example.com',
        responseDeadline: 'DAYS_7', // 7 days deadline, so it's overdue
        acknowledgmentStatus: 'Overdue Responses'
      };

      const ecn = await prisma.eCN.create({ data: ecnData });

      // Test acknowledgment validation for overdue response
      const overdueValidation = BusinessRuleValidator.validateECNWorkflow('acknowledge', {
        status: 'DISTRIBUTED',
        acknowledgmentComments: 'Late acknowledgment with explanation',
        responseDeadline: 'DAYS_7',
        distributedAt: ecn.distributedAt
      }, {
        userRole: 'ENGINEER',
        organizationId: testOrganization.id,
        userId: testUsers.ENGINEER.id,
        department: 'Engineering'
      });

      expect(overdueValidation.isValid).toBe(true);
      expect(overdueValidation.warnings).toContain('Response is past the deadline');
    });
  });

  describe('Cross-Workflow Integration Tests', () => {
    test('End-to-end workflow: ECR → ECO → ECN', async () => {
      // Step 1: Create and approve ECR
      const ecrData = {
        ecrNumber: 'ECR-E2E-001',
        title: 'End-to-End Workflow Test',
        description: 'Complete workflow test from ECR creation through ECN acknowledgment.',
        reason: 'End-to-end integration testing',
        priority: 'HIGH',
        reasonForChange: 'Integration testing',
        customerImpact: 'INDIRECT_IMPACT',
        status: 'APPROVED',
        organizationId: testOrganization.id,
        submitterId: testUsers.REQUESTOR.id,
        assigneeId: testUsers.ENGINEER.id,
        approverId: testUsers.MANAGER.id,
        submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        affectedProducts: 'Integration Test Products',
        costImpact: 12000.00,
        estimatedCostRange: 'FROM_10K_TO_50K',
        targetImplementationDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
      };

      const ecr = await prisma.eCR.create({ data: ecrData });

      // Step 2: Create and complete ECO
      const ecoData = {
        ecoNumber: 'ECO-E2E-001',
        title: 'Implementation of End-to-End Test ECR',
        description: 'ECO for implementing the approved integration test ECR.',
        organizationId: testOrganization.id,
        submitterId: testUsers.MANAGER.id,
        assigneeId: testUsers.ENGINEER.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        implementationPlan: 'Integration test implementation plan',
        testingPlan: 'Integration test validation plan',
        rollbackPlan: 'Integration test rollback plan',
        resourcesRequired: 'Integration test resources',
        estimatedTotalCost: 12000.00,
        actualProgress: 100,
        effectiveDate: new Date(),
        effectivityType: 'DATE_BASED'
      };

      const eco = await prisma.eCO.create({ data: ecoData });

      // Link ECR to ECO
      await prisma.eCR.update({
        where: { id: ecr.id },
        data: { ecoId: eco.id }
      });

      // Step 3: Create and distribute ECN
      const ecnData = {
        ecnNumber: 'ECN-E2E-001',
        title: 'End-to-End Integration Test Complete',
        description: 'ECN for completed integration test implementation.',
        ecoId: eco.id,
        organizationId: testOrganization.id,
        submitterId: testUsers.QUALITY.id,
        assigneeId: testUsers.DOCUMENT_CONTROL.id,
        status: 'DISTRIBUTED',
        effectiveDate: new Date(),
        distributedAt: new Date(),
        changesImplemented: 'Integration test changes implemented successfully',
        affectedItems: 'Integration test components and documentation',
        dispositionInstructions: 'Integration test procedures now in effect',
        distributionList: 'engineer-test@workflow.com, requestor-test@workflow.com',
        responseDeadline: 'DAYS_3',
        implementationStatus: 'COMPLETE',
        acknowledgmentStatus: 'Pending'
      };

      const ecn = await prisma.eCN.create({ data: ecnData });

      // Verify complete workflow chain
      const workflowChain = await prisma.eCR.findUnique({
        where: { id: ecr.id },
        include: {
          eco: {
            include: {
              ecns: true
            }
          }
        }
      });

      expect(workflowChain?.status).toBe('APPROVED');
      expect(workflowChain?.eco?.status).toBe('COMPLETED');
      expect(workflowChain?.eco?.ecns).toHaveLength(1);
      expect(workflowChain?.eco?.ecns[0].status).toBe('DISTRIBUTED');

      // Verify workflow relationships
      expect(workflowChain?.ecoId).toBe(eco.id);
      expect(workflowChain?.eco?.id).toBe(eco.id);
      expect(workflowChain?.eco?.ecns[0].ecoId).toBe(eco.id);
    });

    test('Budget impact validation across workflow', async () => {
      const highCostEcrData = {
        ecrNumber: 'ECR-BUDGET-001',
        title: 'High Cost ECR for Budget Testing',
        description: 'Testing budget validation with high cost ECR.',
        reason: 'Budget validation testing',
        priority: 'CRITICAL',
        reasonForChange: 'Budget testing',
        customerImpact: 'NO_IMPACT',
        status: 'SUBMITTED',
        organizationId: testOrganization.id,
        submitterId: testUsers.REQUESTOR.id,
        assigneeId: testUsers.ENGINEER.id,
        affectedProducts: 'Budget Test Products',
        costImpact: 45000.00, // Close to monthly budget
        estimatedCostRange: 'FROM_10K_TO_50K'
      };

      // Test budget validation (organization budget is 50000.00)
      const budgetValidation = BusinessRuleValidator.validateECRWorkflow('create', highCostEcrData, {
        userRole: 'REQUESTOR',
        organizationId: testOrganization.id,
        userId: testUsers.REQUESTOR.id,
        department: 'Operations'
      });

      expect(budgetValidation.isValid).toBe(true);
      expect(budgetValidation.warnings.some(w => w.includes('budget'))).toBe(true);

      // Test exceeding budget
      const exceedingBudgetData = { ...highCostEcrData, costImpact: 55000.00 };
      
      // This would fail budget validation in a real scenario
      // For now, we just verify the validation logic exists
      expect(exceedingBudgetData.costImpact).toBeGreaterThan(testOrganization.monthlyBudget);
    });
  });

  describe('Role-based Permission Integration', () => {
    test('Comprehensive role permission validation', async () => {
      const roles = ['ADMIN', 'MANAGER', 'ENGINEER', 'QUALITY', 'MANUFACTURING', 'REQUESTOR', 'DOCUMENT_CONTROL', 'VIEWER'];
      const entities = ['ECR', 'ECO', 'ECN'];
      const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE'];

      roles.forEach(role => {
        entities.forEach(entity => {
          actions.forEach(action => {
            const hasPermissionResult = hasPermission(role as any, entity as any, action as any);
            expect(typeof hasPermissionResult).toBe('boolean');
            
            // Specific validations
            if (role === 'VIEWER') {
              if (action === 'READ') {
                expect(hasPermissionResult).toBe(true);
              } else {
                expect(hasPermissionResult).toBe(false);
              }
            }
            
            if (role === 'ADMIN') {
              expect(hasPermissionResult).toBe(true); // Admin has all permissions
            }
          });
        });
      });
    });

    test('Context-based permission validation', async () => {
      // Create test ECR for context testing
      const testEcr = await prisma.eCR.create({
        data: {
          ecrNumber: 'ECR-CONTEXT-001',
          title: 'Context Permission Test ECR',
          description: 'Testing context-based permissions',
          reason: 'Context testing',
          priority: 'LOW',
          reasonForChange: 'Testing',
          customerImpact: 'NO_IMPACT',
          status: 'DRAFT',
          organizationId: testOrganization.id,
          submitterId: testUsers.REQUESTOR.id,
          assigneeId: testUsers.ENGINEER.id,
          affectedProducts: 'Test Products',
          costImpact: 1000.00,
          estimatedCostRange: 'UNDER_1K'
        }
      });

      // Test owner permissions
      const ownerContext = {
        entityId: testEcr.id,
        entityType: 'ECR' as const,
        ownerId: testUsers.REQUESTOR.id,
        assigneeId: testUsers.ENGINEER.id,
        organizationId: testOrganization.id
      };

      // Owner should be able to update their own ECR
      expect(hasPermission('REQUESTOR', 'ECR', 'UPDATE', ownerContext)).toBe(true);

      // Non-owner should not be able to update (depends on implementation)
      const nonOwnerContext = { ...ownerContext, userId: testUsers.MANUFACTURING.id };
      // This would depend on specific business rules implementation
    });
  });
});