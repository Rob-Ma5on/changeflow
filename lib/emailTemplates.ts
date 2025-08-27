// Email notification templates for Phase 1 change management

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ECRData {
  ecrNumber: string;
  title: string;
  description: string;
  priority: string;
  customerImpact: string;
  reasonForChange: string;
  submitter: {
    name: string;
    email: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
    email: string;
  };
  targetImplementationDate?: string;
  estimatedCostRange?: string;
  stakeholders?: string;
  appUrl: string;
}

export interface ECOData {
  ecoNumber: string;
  title: string;
  description: string;
  priority: string;
  effectiveDate: string;
  effectivityType: string;
  materialDisposition: string;
  implementationTeam?: string;
  estimatedTotalCost?: number;
  submitter: {
    name: string;
    email: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
  ecrs: Array<{
    ecrNumber: string;
    title: string;
  }>;
  appUrl: string;
}

export interface ECNData {
  ecnNumber: string;
  title: string;
  description: string;
  effectiveDate?: string;
  distributionList: string;
  customerNotificationRequired: string;
  responseDeadline?: string;
  implementationStatus: string;
  submitter: {
    name: string;
    email: string;
  };
  eco?: {
    ecoNumber: string;
    title: string;
  };
  changesImplemented?: string;
  appUrl: string;
}

// Utility function to format priority with color coding
const formatPriority = (priority: string): string => {
  const priorityColors = {
    'CRITICAL': '#dc2626', // red-600
    'HIGH': '#ea580c',     // orange-600
    'MEDIUM': '#ca8a04',   // yellow-600
    'LOW': '#16a34a'       // green-600
  };
  const color = priorityColors[priority as keyof typeof priorityColors] || '#6b7280';
  return `<span style="color: ${color}; font-weight: bold;">${priority}</span>`;
};

// Utility function to format customer impact
const formatCustomerImpact = (impact: string): string => {
  const impactColors = {
    'DIRECT_IMPACT': '#dc2626',    // red-600
    'INDIRECT_IMPACT': '#ea580c',  // orange-600
    'NO_IMPACT': '#16a34a'         // green-600
  };
  const color = impactColors[impact as keyof typeof impactColors] || '#6b7280';
  const label = impact.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  return `<span style="color: ${color}; font-weight: bold;">${label}</span>`;
};

// Utility function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Utility function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Base email styling
const getBaseStyles = (): string => `
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 3px solid #3b82f6; }
    .content { background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background-color: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    .field-group { margin-bottom: 15px; }
    .field-label { font-weight: bold; color: #374151; }
    .field-value { margin-left: 10px; }
    .priority-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
    .button:hover { background-color: #2563eb; }
    .divider { border-bottom: 1px solid #e5e7eb; margin: 20px 0; }
  </style>
`;

// 1. ECR Submitted - notify reviewers
export const generateECRSubmittedEmail = (data: ECRData): EmailTemplate => {
  const subject = `Action Required: Review ECR ${data.ecrNumber} - ${data.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #1f2937;">Engineering Change Request Submitted</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Action required for review and approval</p>
        </div>
        
        <div class="content">
          <div class="field-group">
            <span class="field-label">ECR Number:</span>
            <span class="field-value" style="font-weight: bold; color: #3b82f6;">${data.ecrNumber}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Title:</span>
            <span class="field-value">${data.title}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Priority:</span>
            <span class="field-value">${formatPriority(data.priority)}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Customer Impact:</span>
            <span class="field-value">${formatCustomerImpact(data.customerImpact)}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Submitted by:</span>
            <span class="field-value">${data.submitter.name} (${data.submitter.email})</span>
          </div>
          
          ${data.estimatedCostRange ? `
          <div class="field-group">
            <span class="field-label">Estimated Cost Range:</span>
            <span class="field-value">${data.estimatedCostRange.replace(/_/g, ' ')}</span>
          </div>
          ` : ''}
          
          ${data.targetImplementationDate ? `
          <div class="field-group">
            <span class="field-label">Target Implementation Date:</span>
            <span class="field-value">${formatDate(data.targetImplementationDate)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="field-group">
            <span class="field-label">Description:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${data.description}
            </div>
          </div>
          
          <div class="field-group">
            <span class="field-label">Reason for Change:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${data.reasonForChange}
            </div>
          </div>
          
          ${data.stakeholders ? `
          <div class="field-group">
            <span class="field-label">Stakeholders:</span>
            <span class="field-value">${data.stakeholders}</span>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard/ecr/${data.ecrNumber}" class="button">Review ECR</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This ECR requires your review and approval. Please log in to the Change Management System to take action.</p>
          <p>If you cannot access the link above, copy and paste this URL into your browser: ${data.appUrl}/dashboard/ecr</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Engineering Change Request Submitted - Action Required

ECR Number: ${data.ecrNumber}
Title: ${data.title}
Priority: ${data.priority}
Customer Impact: ${data.customerImpact.replace(/_/g, ' ')}
Submitted by: ${data.submitter.name} (${data.submitter.email})

${data.estimatedCostRange ? `Estimated Cost Range: ${data.estimatedCostRange.replace(/_/g, ' ')}\n` : ''}
${data.targetImplementationDate ? `Target Implementation Date: ${formatDate(data.targetImplementationDate)}\n` : ''}

Description:
${data.description}

Reason for Change:
${data.reasonForChange}

${data.stakeholders ? `Stakeholders: ${data.stakeholders}\n` : ''}

Please review this ECR in the Change Management System:
${data.appUrl}/dashboard/ecr
  `;

  return { subject, html, text };
};

// 2. ECR Approved - notify submitter and assignee
export const generateECRApprovedEmail = (data: ECRData): EmailTemplate => {
  const subject = `ECR Approved: ${data.ecrNumber} - ${data.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #059669;">Engineering Change Request Approved</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Ready to proceed to next phase</p>
        </div>
        
        <div class="content">
          <div class="field-group">
            <span class="field-label">ECR Number:</span>
            <span class="field-value" style="font-weight: bold; color: #059669;">${data.ecrNumber}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Title:</span>
            <span class="field-value">${data.title}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Priority:</span>
            <span class="field-value">${formatPriority(data.priority)}</span>
          </div>
          
          ${data.approver ? `
          <div class="field-group">
            <span class="field-label">Approved by:</span>
            <span class="field-value">${data.approver.name} (${data.approver.email})</span>
          </div>
          ` : ''}
          
          ${data.assignee ? `
          <div class="field-group">
            <span class="field-label">Assigned to:</span>
            <span class="field-value">${data.assignee.name} (${data.assignee.email})</span>
          </div>
          ` : ''}
          
          ${data.targetImplementationDate ? `
          <div class="field-group">
            <span class="field-label">Target Implementation Date:</span>
            <span class="field-value">${formatDate(data.targetImplementationDate)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #059669;">Next Steps</h3>
            <ul style="margin: 0; color: #065f46;">
              <li>This ECR can now be bundled into an ECO (Engineering Change Order)</li>
              <li>Implementation planning should begin</li>
              <li>Coordinate with stakeholders for execution</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard/ecr/${data.ecrNumber}" class="button" style="background-color: #059669;">View ECR Details</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This ECR has been approved and is ready for the next phase of implementation.</p>
          <p>Access the Change Management System: ${data.appUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Engineering Change Request Approved

ECR Number: ${data.ecrNumber}
Title: ${data.title}
Priority: ${data.priority}

${data.approver ? `Approved by: ${data.approver.name} (${data.approver.email})\n` : ''}
${data.assignee ? `Assigned to: ${data.assignee.name} (${data.assignee.email})\n` : ''}
${data.targetImplementationDate ? `Target Implementation Date: ${formatDate(data.targetImplementationDate)}\n` : ''}

Next Steps:
- This ECR can now be bundled into an ECO (Engineering Change Order)
- Implementation planning should begin
- Coordinate with stakeholders for execution

View ECR details: ${data.appUrl}/dashboard/ecr
  `;

  return { subject, html, text };
};

// 3. ECO Ready for Implementation - notify team
export const generateECOImplementationReadyEmail = (data: ECOData): EmailTemplate => {
  const subject = `Implementation Required: ECO ${data.ecoNumber} - ${data.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #7c3aed;">Engineering Change Order - Ready for Implementation</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Implementation team action required</p>
        </div>
        
        <div class="content">
          <div class="field-group">
            <span class="field-label">ECO Number:</span>
            <span class="field-value" style="font-weight: bold; color: #7c3aed;">${data.ecoNumber}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Title:</span>
            <span class="field-value">${data.title}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Priority:</span>
            <span class="field-value">${formatPriority(data.priority)}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Effective Date:</span>
            <span class="field-value" style="font-weight: bold; color: #dc2626;">${formatDate(data.effectiveDate)}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Effectivity Type:</span>
            <span class="field-value">${data.effectivityType.replace(/_/g, ' ')}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Material Disposition:</span>
            <span class="field-value">${data.materialDisposition.replace(/_/g, ' ')}</span>
          </div>
          
          ${data.implementationTeam ? `
          <div class="field-group">
            <span class="field-label">Implementation Team:</span>
            <span class="field-value">${data.implementationTeam}</span>
          </div>
          ` : ''}
          
          ${data.estimatedTotalCost ? `
          <div class="field-group">
            <span class="field-label">Estimated Total Cost:</span>
            <span class="field-value" style="font-weight: bold;">${formatCurrency(data.estimatedTotalCost)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          ${data.ecrs.length > 0 ? `
          <div class="field-group">
            <span class="field-label">Bundled ECRs:</span>
            <ul style="margin-top: 10px;">
              ${data.ecrs.map(ecr => `<li><strong>${ecr.ecrNumber}:</strong> ${ecr.title}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="field-group">
            <span class="field-label">Description:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${data.description}
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Implementation Required</h3>
            <p style="margin: 0; color: #92400e;">
              This ECO is approved and ready for implementation. Please coordinate with your team to execute the changes according to the effective date and material disposition requirements.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard/eco/${data.ecoNumber}" class="button" style="background-color: #7c3aed;">View ECO Details</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This ECO requires implementation by the assigned team. Please coordinate execution according to the specified timeline.</p>
          <p>Access the Change Management System: ${data.appUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Engineering Change Order - Ready for Implementation

ECO Number: ${data.ecoNumber}
Title: ${data.title}
Priority: ${data.priority}
Effective Date: ${formatDate(data.effectiveDate)}
Effectivity Type: ${data.effectivityType.replace(/_/g, ' ')}
Material Disposition: ${data.materialDisposition.replace(/_/g, ' ')}

${data.implementationTeam ? `Implementation Team: ${data.implementationTeam}\n` : ''}
${data.estimatedTotalCost ? `Estimated Total Cost: ${formatCurrency(data.estimatedTotalCost)}\n` : ''}

${data.ecrs.length > 0 ? `Bundled ECRs:\n${data.ecrs.map(ecr => `- ${ecr.ecrNumber}: ${ecr.title}`).join('\n')}\n` : ''}

Description:
${data.description}

IMPLEMENTATION REQUIRED:
This ECO is approved and ready for implementation. Please coordinate with your team to execute the changes according to the effective date and material disposition requirements.

View ECO details: ${data.appUrl}/dashboard/eco
  `;

  return { subject, html, text };
};

// 4. ECN Distribution - notify all stakeholders
export const generateECNDistributionEmail = (data: ECNData): EmailTemplate => {
  const subject = `Engineering Change Notice: ${data.ecnNumber} - ${data.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #dc2626;">Engineering Change Notice</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Formal notification of implemented changes</p>
        </div>
        
        <div class="content">
          <div class="field-group">
            <span class="field-label">ECN Number:</span>
            <span class="field-value" style="font-weight: bold; color: #dc2626;">${data.ecnNumber}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Title:</span>
            <span class="field-value">${data.title}</span>
          </div>
          
          ${data.effectiveDate ? `
          <div class="field-group">
            <span class="field-label">Effective Date:</span>
            <span class="field-value" style="font-weight: bold;">${formatDate(data.effectiveDate)}</span>
          </div>
          ` : ''}
          
          <div class="field-group">
            <span class="field-label">Customer Notification:</span>
            <span class="field-value">${data.customerNotificationRequired.replace(/_/g, ' ')}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Implementation Status:</span>
            <span class="field-value" style="color: #059669; font-weight: bold;">${data.implementationStatus.replace(/_/g, ' ')}</span>
          </div>
          
          ${data.responseDeadline ? `
          <div class="field-group">
            <span class="field-label">Response Deadline:</span>
            <span class="field-value" style="color: #dc2626; font-weight: bold;">${data.responseDeadline.replace(/_/g, ' ')}</span>
          </div>
          ` : ''}
          
          ${data.eco ? `
          <div class="field-group">
            <span class="field-label">Related ECO:</span>
            <span class="field-value">${data.eco.ecoNumber} - ${data.eco.title}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="field-group">
            <span class="field-label">Description:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${data.description}
            </div>
          </div>
          
          ${data.changesImplemented ? `
          <div class="field-group">
            <span class="field-label">Changes Implemented:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px;">
              ${data.changesImplemented}
            </div>
          </div>
          ` : ''}
          
          ${data.responseDeadline ? `
          <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">Action Required</h3>
            <p style="margin: 0; color: #7f1d1d;">
              Please acknowledge receipt of this Engineering Change Notice by the response deadline: <strong>${data.responseDeadline.replace(/_/g, ' ')}</strong>
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard/ecn/${data.ecnNumber}" class="button" style="background-color: #dc2626;">View ECN Details</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a formal Engineering Change Notice. Please review the changes and acknowledge receipt as required.</p>
          <p>Access the Change Management System: ${data.appUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Engineering Change Notice

ECN Number: ${data.ecnNumber}
Title: ${data.title}
${data.effectiveDate ? `Effective Date: ${formatDate(data.effectiveDate)}\n` : ''}Customer Notification: ${data.customerNotificationRequired.replace(/_/g, ' ')}
Implementation Status: ${data.implementationStatus.replace(/_/g, ' ')}
${data.responseDeadline ? `Response Deadline: ${data.responseDeadline.replace(/_/g, ' ')}\n` : ''}
${data.eco ? `Related ECO: ${data.eco.ecoNumber} - ${data.eco.title}\n` : ''}

Description:
${data.description}

${data.changesImplemented ? `Changes Implemented:\n${data.changesImplemented}\n\n` : ''}

${data.responseDeadline ? `ACTION REQUIRED: Please acknowledge receipt of this Engineering Change Notice by the response deadline: ${data.responseDeadline.replace(/_/g, ' ')}\n\n` : ''}

View ECN details: ${data.appUrl}/dashboard/ecn
  `;

  return { subject, html, text };
};

// 5. ECN Reminder - for pending acknowledgments
export const generateECNReminderEmail = (data: ECNData): EmailTemplate => {
  const subject = `REMINDER: Acknowledgment Required - ECN ${data.ecnNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #f59e0b;">ECN Acknowledgment Reminder</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Response required for Engineering Change Notice</p>
        </div>
        
        <div class="content">
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 0 0 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Action Required</h3>
            <p style="margin: 0; color: #92400e;">
              You have not yet acknowledged receipt of this Engineering Change Notice. Please review and respond promptly.
            </p>
          </div>
          
          <div class="field-group">
            <span class="field-label">ECN Number:</span>
            <span class="field-value" style="font-weight: bold; color: #dc2626;">${data.ecnNumber}</span>
          </div>
          
          <div class="field-group">
            <span class="field-label">Title:</span>
            <span class="field-value">${data.title}</span>
          </div>
          
          ${data.effectiveDate ? `
          <div class="field-group">
            <span class="field-label">Effective Date:</span>
            <span class="field-value" style="font-weight: bold;">${formatDate(data.effectiveDate)}</span>
          </div>
          ` : ''}
          
          ${data.responseDeadline ? `
          <div class="field-group">
            <span class="field-label">Response Deadline:</span>
            <span class="field-value" style="color: #dc2626; font-weight: bold;">${data.responseDeadline.replace(/_/g, ' ')}</span>
          </div>
          ` : ''}
          
          <div class="field-group">
            <span class="field-label">Implementation Status:</span>
            <span class="field-value">${data.implementationStatus.replace(/_/g, ' ')}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="field-group">
            <span class="field-label">Summary:</span>
            <div style="margin-top: 10px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description}
            </div>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">Acknowledgment Required</h3>
            <p style="margin: 0; color: #7f1d1d;">
              Please log in to the Change Management System to acknowledge receipt of this ECN. Your acknowledgment confirms that you have reviewed the change notice and understand its implications.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard/ecn/${data.ecnNumber}" class="button" style="background-color: #f59e0b;">Acknowledge ECN Now</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a reminder for a pending ECN acknowledgment. Please respond promptly to avoid delays.</p>
          <p>If you have already acknowledged this ECN, please disregard this reminder.</p>
          <p>Access the Change Management System: ${data.appUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
REMINDER: ECN Acknowledgment Required

⚠️ ACTION REQUIRED: You have not yet acknowledged receipt of this Engineering Change Notice. Please review and respond promptly.

ECN Number: ${data.ecnNumber}
Title: ${data.title}
${data.effectiveDate ? `Effective Date: ${formatDate(data.effectiveDate)}\n` : ''}${data.responseDeadline ? `Response Deadline: ${data.responseDeadline.replace(/_/g, ' ')}\n` : ''}Implementation Status: ${data.implementationStatus.replace(/_/g, ' ')}

Summary:
${data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description}

ACKNOWLEDGMENT REQUIRED:
Please log in to the Change Management System to acknowledge receipt of this ECN. Your acknowledgment confirms that you have reviewed the change notice and understand its implications.

Acknowledge ECN: ${data.appUrl}/dashboard/ecn

If you have already acknowledged this ECN, please disregard this reminder.
  `;

  return { subject, html, text };
};

// Utility function to generate email template based on type
export const generateEmailTemplate = (
  type: 'ecr_submitted' | 'ecr_approved' | 'eco_ready' | 'ecn_distributed' | 'ecn_reminder',
  data: ECRData | ECOData | ECNData
): EmailTemplate => {
  switch (type) {
    case 'ecr_submitted':
      return generateECRSubmittedEmail(data as ECRData);
    case 'ecr_approved':
      return generateECRApprovedEmail(data as ECRData);
    case 'eco_ready':
      return generateECOImplementationReadyEmail(data as ECOData);
    case 'ecn_distributed':
      return generateECNDistributionEmail(data as ECNData);
    case 'ecn_reminder':
      return generateECNReminderEmail(data as ECNData);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
};

// Helper function to extract email addresses from distribution list
export const parseDistributionList = (distributionList: string): string[] => {
  return distributionList
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0)
    .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
};

// Helper function to determine recipients based on notification type
export const getEmailRecipients = (
  type: 'ecr_submitted' | 'ecr_approved' | 'eco_ready' | 'ecn_distributed' | 'ecn_reminder',
  data: ECRData | ECOData | ECNData
): string[] => {
  switch (type) {
    case 'ecr_submitted':
      const ecrData = data as ECRData;
      return [
        ...(ecrData.approver ? [ecrData.approver.email] : []),
        ...(ecrData.assignee ? [ecrData.assignee.email] : [])
      ].filter(Boolean);
    
    case 'ecr_approved':
      const approvedData = data as ECRData;
      return [
        approvedData.submitter.email,
        ...(approvedData.assignee ? [approvedData.assignee.email] : [])
      ].filter(Boolean);
    
    case 'eco_ready':
      const ecoData = data as ECOData;
      return [
        ...(ecoData.assignee ? [ecoData.assignee.email] : []),
        ecoData.submitter.email
      ].filter(Boolean);
    
    case 'ecn_distributed':
    case 'ecn_reminder':
      const ecnData = data as ECNData;
      return parseDistributionList(ecnData.distributionList);
    
    default:
      return [];
  }
};