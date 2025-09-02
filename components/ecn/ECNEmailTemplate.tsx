'use client';

import React from 'react';

interface ECNEmailTemplateProps {
  ecnNumber: string;
  title: string;
  changeSummary: string;
  implementationDate: string;
  specialInstructions?: string;
  recipientName: string;
  acknowledgeRequired: boolean;
  responseDeadline?: string;
  acknowledgeLink: string;
  companyName?: string;
  companyLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function ECNEmailTemplate({
  ecnNumber,
  title,
  changeSummary,
  implementationDate,
  specialInstructions,
  recipientName,
  acknowledgeRequired,
  responseDeadline,
  acknowledgeLink,
  companyName = 'ChangeFlow Industries',
  companyLogo,
  contactEmail = 'document.control@changeflow.com',
  contactPhone = '(555) 123-4567'
}: ECNEmailTemplateProps) {
  
  const emailStyles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    header: {
      backgroundColor: '#1f2937',
      color: '#ffffff',
      padding: '20px',
      textAlign: 'center' as const
    },
    logo: {
      maxHeight: '50px',
      marginBottom: '10px'
    },
    ecnNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '10px 0',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '4px',
      display: 'inline-block'
    },
    content: {
      padding: '30px'
    },
    greeting: {
      fontSize: '16px',
      marginBottom: '20px',
      color: '#374151'
    },
    section: {
      marginBottom: '25px',
      padding: '15px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '10px',
      borderBottom: '2px solid #3b82f6',
      paddingBottom: '5px'
    },
    alertBox: {
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '6px',
      padding: '15px',
      marginBottom: '20px'
    },
    alertTitle: {
      fontWeight: 'bold',
      color: '#92400e',
      marginBottom: '5px'
    },
    urgentBox: {
      backgroundColor: '#fecaca',
      border: '2px solid #ef4444',
      borderRadius: '6px',
      padding: '15px',
      marginBottom: '20px',
      textAlign: 'center' as const
    },
    actionButton: {
      display: 'inline-block',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      padding: '12px 24px',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '16px',
      margin: '10px 0'
    },
    bulletList: {
      margin: '10px 0',
      paddingLeft: '20px'
    },
    footer: {
      backgroundColor: '#f3f4f6',
      padding: '20px',
      textAlign: 'center' as const,
      fontSize: '12px',
      color: '#6b7280',
      borderTop: '1px solid #e5e7eb'
    },
    contactInfo: {
      marginTop: '15px',
      fontSize: '14px'
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUrgencyLevel = () => {
    if (!responseDeadline) return null;
    
    const deadline = new Date(responseDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 24) {
      return 'HIGH';
    } else if (hoursUntilDeadline <= 48) {
      return 'MEDIUM';
    }
    return 'LOW';
  };

  const urgencyLevel = getUrgencyLevel();

  // This component would typically be used to generate HTML for email sending
  // For demonstration, we'll return JSX that matches the HTML structure
  return (
    <div style={emailStyles.container}>
      {/* Header */}
      <div style={emailStyles.header}>
        {companyLogo && (
          <img src={companyLogo} alt={companyName} style={emailStyles.logo} />
        )}
        <h1 style={{ margin: '10px 0', fontSize: '20px' }}>{companyName}</h1>
        <div style={emailStyles.ecnNumber}>
          ECN {ecnNumber}
        </div>
        <h2 style={{ margin: '10px 0', fontSize: '16px', fontWeight: 'normal' }}>
          Engineering Change Notice
        </h2>
      </div>

      {/* Content */}
      <div style={emailStyles.content}>
        {/* Greeting */}
        <div style={emailStyles.greeting}>
          Dear {recipientName},
        </div>

        {/* Urgency Alert */}
        {urgencyLevel === 'HIGH' && acknowledgeRequired && (
          <div style={emailStyles.urgentBox}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
              ⚠️ URGENT - IMMEDIATE ATTENTION REQUIRED ⚠️
            </div>
            <div style={{ marginTop: '5px', color: '#7f1d1d' }}>
              Response required within 24 hours
            </div>
          </div>
        )}

        {/* Main Notice */}
        <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' }}>
          This <strong>Engineering Change Notice (ECN {ecnNumber})</strong> notifies you of an important 
          change that affects your operations. Please read this notice carefully and take the required actions.
        </p>

        {/* Change Summary Section */}
        <div style={emailStyles.section}>
          <div style={emailStyles.sectionTitle}>📋 What Changed</div>
          <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
            <strong>{title}</strong>
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', lineHeight: '1.5' }}>
            {changeSummary}
          </p>
        </div>

        {/* Implementation Date Section */}
        <div style={emailStyles.section}>
          <div style={emailStyles.sectionTitle}>📅 When Effective</div>
          <div style={emailStyles.alertBox}>
            <div style={emailStyles.alertTitle}>Implementation Date:</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {formatDate(implementationDate)}
            </div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              All changes must be implemented by this date
            </div>
          </div>
        </div>

        {/* Required Actions Section */}
        <div style={emailStyles.section}>
          <div style={emailStyles.sectionTitle}>✅ Required Actions</div>
          <ul style={emailStyles.bulletList}>
            <li>Review this change notice thoroughly</li>
            <li>Update your local documentation and procedures</li>
            <li>Inform your team members of the changes</li>
            <li>Ensure compliance with new requirements by the implementation date</li>
            <li>Update any affected training materials</li>
            {acknowledgeRequired && (
              <li><strong>Acknowledge receipt of this ECN (required)</strong></li>
            )}
          </ul>
        </div>

        {/* Special Instructions */}
        {specialInstructions && (
          <div style={emailStyles.section}>
            <div style={emailStyles.sectionTitle}>⚡ Special Instructions</div>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              border: '1px solid #3b82f6', 
              borderRadius: '4px', 
              padding: '10px',
              fontSize: '14px'
            }}>
              {specialInstructions}
            </div>
          </div>
        )}

        {/* Acknowledgment Section */}
        {acknowledgeRequired && (
          <div style={emailStyles.section}>
            <div style={emailStyles.sectionTitle}>✋ Acknowledgment Required</div>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
              You must acknowledge receipt of this ECN to confirm you have received and reviewed the changes.
            </p>
            
            {responseDeadline && (
              <div style={{ 
                backgroundColor: urgencyLevel === 'HIGH' ? '#fecaca' : '#fef3c7',
                border: `1px solid ${urgencyLevel === 'HIGH' ? '#ef4444' : '#f59e0b'}`,
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <strong>Response Deadline: {formatDate(responseDeadline)}</strong>
              </div>
            )}
            
            <div style={{ textAlign: 'center' }}>
              <a href={acknowledgeLink} style={emailStyles.actionButton}>
                🔗 ACKNOWLEDGE ECN {ecnNumber}
              </a>
            </div>
            
            <p style={{ margin: '15px 0 0 0', fontSize: '12px', textAlign: 'center', color: '#6b7280' }}>
              Click the button above or copy this link to your browser:<br/>
              <span style={{ wordBreak: 'break-all' }}>{acknowledgeLink}</span>
            </p>
          </div>
        )}

        {/* Important Notice */}
        <div style={{
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '15px',
          marginTop: '20px',
          fontSize: '13px',
          color: '#374151'
        }}>
          <strong>Important:</strong> This is an official engineering change notice. 
          Failure to implement these changes by the specified date may result in non-compliance 
          with quality standards and could affect product safety and performance.
        </div>
      </div>

      {/* Footer */}
      <div style={emailStyles.footer}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          <strong>Document Control Team</strong><br/>
          {companyName}
        </div>
        
        <div style={emailStyles.contactInfo}>
          📧 {contactEmail}<br/>
          📞 {contactPhone}
        </div>
        
        <div style={{ margin: '15px 0 5px 0', fontSize: '11px' }}>
          This email was sent from an automated system. Please do not reply to this email.
          For questions about this ECN, contact the Document Control team using the information above.
        </div>
        
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
          ECN {ecnNumber} | Sent: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Export function to generate HTML string for email sending
export function generateECNEmailHTML(props: ECNEmailTemplateProps): string {
  // This function would convert the component to HTML string
  // Implementation would depend on your server-side rendering setup
  // For now, returning a template string
  
  const {
    ecnNumber,
    title,
    changeSummary,
    implementationDate,
    specialInstructions,
    recipientName,
    acknowledgeRequired,
    responseDeadline,
    acknowledgeLink,
    companyName = 'ChangeFlow Industries',
    contactEmail = 'document.control@changeflow.com',
    contactPhone = '(555) 123-4567'
  } = props;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUrgencyHTML = () => {
    if (!responseDeadline || !acknowledgeRequired) return '';
    
    const deadline = new Date(responseDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 24) {
      return `
        <div style="background-color: #fecaca; border: 2px solid #ef4444; border-radius: 6px; padding: 15px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 16px; font-weight: bold; color: #dc2626;">
            ⚠️ URGENT - IMMEDIATE ATTENTION REQUIRED ⚠️
          </div>
          <div style="margin-top: 5px; color: #7f1d1d;">
            Response required within 24 hours
          </div>
        </div>
      `;
    }
    return '';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ECN ${ecnNumber} - ${title}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 10px 0; font-size: 20px;">${companyName}</h1>
          <div style="font-size: 24px; font-weight: bold; margin: 10px 0; background-color: #ef4444; color: #ffffff; padding: 8px 16px; border-radius: 4px; display: inline-block;">
            ECN ${ecnNumber}
          </div>
          <h2 style="margin: 10px 0; font-size: 16px; font-weight: normal;">
            Engineering Change Notice
          </h2>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Greeting -->
          <div style="font-size: 16px; margin-bottom: 20px; color: #374151;">
            Dear ${recipientName},
          </div>

          ${getUrgencyHTML()}

          <!-- Main Notice -->
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            This <strong>Engineering Change Notice (ECN ${ecnNumber})</strong> notifies you of an important 
            change that affects your operations. Please read this notice carefully and take the required actions.
          </p>

          <!-- Change Summary -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
              📋 What Changed
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>${title}</strong>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.5;">
              ${changeSummary}
            </p>
          </div>

          <!-- Implementation Date -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
              📅 When Effective
            </div>
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px;">
              <div style="font-weight: bold; color: #92400e; margin-bottom: 5px;">Implementation Date:</div>
              <div style="font-size: 16px; font-weight: bold;">
                ${formatDate(implementationDate)}
              </div>
              <div style="font-size: 12px; margin-top: 5px;">
                All changes must be implemented by this date
              </div>
            </div>
          </div>

          <!-- Required Actions -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
              ✅ Required Actions
            </div>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Review this change notice thoroughly</li>
              <li>Update your local documentation and procedures</li>
              <li>Inform your team members of the changes</li>
              <li>Ensure compliance with new requirements by the implementation date</li>
              <li>Update any affected training materials</li>
              ${acknowledgeRequired ? '<li><strong>Acknowledge receipt of this ECN (required)</strong></li>' : ''}
            </ul>
          </div>

          ${specialInstructions ? `
          <!-- Special Instructions -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
              ⚡ Special Instructions
            </div>
            <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 10px; font-size: 14px;">
              ${specialInstructions}
            </div>
          </div>
          ` : ''}

          ${acknowledgeRequired ? `
          <!-- Acknowledgment Section -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
              ✋ Acknowledgment Required
            </div>
            <p style="margin: 0 0 15px 0; font-size: 14px;">
              You must acknowledge receipt of this ECN to confirm you have received and reviewed the changes.
            </p>
            
            ${responseDeadline ? `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 10px; margin-bottom: 15px; font-size: 14px;">
              <strong>Response Deadline: ${formatDate(responseDeadline)}</strong>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${acknowledgeLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
                🔗 ACKNOWLEDGE ECN ${ecnNumber}
              </a>
            </div>
            
            <p style="margin: 15px 0 0 0; font-size: 12px; text-align: center; color: #6b7280;">
              Click the button above or copy this link to your browser:<br/>
              <span style="word-break: break-all;">${acknowledgeLink}</span>
            </p>
          </div>
          ` : ''}

          <!-- Important Notice -->
          <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-top: 20px; font-size: 13px; color: #374151;">
            <strong>Important:</strong> This is an official engineering change notice. 
            Failure to implement these changes by the specified date may result in non-compliance 
            with quality standards and could affect product safety and performance.
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 14px; margin-bottom: 10px;">
            <strong>Document Control Team</strong><br/>
            ${companyName}
          </div>
          
          <div style="margin-top: 15px; font-size: 14px;">
            📧 ${contactEmail}<br/>
            📞 ${contactPhone}
          </div>
          
          <div style="margin: 15px 0 5px 0; font-size: 11px;">
            This email was sent from an automated system. Please do not reply to this email.
            For questions about this ECN, contact the Document Control team using the information above.
          </div>
          
          <div style="font-size: 10px; color: #9ca3af;">
            ECN ${ecnNumber} | Sent: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}