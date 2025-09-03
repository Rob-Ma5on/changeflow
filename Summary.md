# ChangeFlow - Engineering Change Management System

## Overview
ChangeFlow is a complete engineering change management system built with Next.js 15, implementing the full ECR→ECO→ECN workflow with Phase 1 field enhancements, comprehensive traceability, analytics dashboard, and mobile-responsive design.

## 🎯 Core Features

### Engineering Change Workflow
- **ECR (Engineering Change Request)**: Change requests with Phase 1 priority, customer impact, and cost analysis
- **ECO (Engineering Change Order)**: Implementation tracking with cost tracking, resource allocation, and quality gates
- **ECN (Engineering Change Notice)**: Formal notifications with communication tracking and stakeholder management
- **Complete Traceability**: Full audit trail with enhanced Phase 1 fields and analytics

### User Interface
- **Unified Design System**: Consistent components across all sections
- **Dual View Modes**: Kanban boards and sortable list tables
- **Mobile Responsive**: Optimized for all screen sizes
- **Analytics Dashboard**: Phase 1 metrics with charts, priority breakdowns, and implementation tracking
- **Export Features**: CSV/Excel export with Phase 1 data
- **Email Templates**: Automated notifications for Phase 1 workflow events

### Key Workflows
1. **ECR Creation & Approval**: Submit → Review → Approve/Reject
2. **ECR Bundling**: Multi-select approved ECRs for coordinated implementation
3. **ECO Management**: Track implementation progress with status updates
4. **ECN Generation**: Automatic creation with matching numbers (ECO-2025-001 → ECN-2025-001)
5. **Universal Search**: Find any item by number for complete traceability

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM and Phase 1 schema enhancements
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with custom color scheme and comprehensive dark mode support
- **Charts**: Chart.js and react-chartjs-2 for analytics
- **Export**: CSV generation for Phase 1 data
- **Deployment**: Vercel-ready configuration

## 🎨 Design System

### Color Scheme
- **Primary**: #0066CC (buttons, active states, links)
- **ECR Accent**: #3B82F6 (blue)
- **ECO Accent**: #10B981 (green)  
- **ECN Accent**: #F59E0B (amber)
- **Priority Colors**: Critical (#dc2626), High (#ea580c), Medium (#ca8a04), Low (#16a34a)
- **Customer Impact**: Direct (#dc2626), Indirect (#ea580c), None (#16a34a)

### Components
- **ViewToggle**: Kanban/List view switching
- **FilterBar**: Universal filtering with mobile collapse and Phase 1 filters, full dark mode support
- **EntityCard**: Consistent card layout with Phase 1 field display
- **ColumnHeader**: Sortable table headers with visual indicators
- **Analytics Charts**: Priority breakdowns, customer impact, and implementation status
- **RevisionHistory**: Expandable revision tracking with field-level change visualization and dark mode styling

## 📱 Mobile Features

- **Responsive Navigation**: Collapsible sidebar with overlay
- **Smart Column Hiding**: Less important columns hidden on small screens
- **Touch-Friendly**: Optimized buttons and touch targets
- **Scrollable Tables**: Horizontal scroll for table overflow

## 🚀 Recent Updates (Latest: Critical ECR Creation Bug Fix)

### Critical ECR Creation Bug Fix
- **Permission System Fix**: Resolved critical JavaScript error `TypeError: Cannot read properties of undefined (reading 'find')` in the permissions system
- **API Route Correction**: Fixed `/api/users` endpoint to include the `role` field in SELECT queries, resolving undefined user role issues
- **Comprehensive Testing**: Validated ECR creation functionality across all user roles (ADMIN, ENGINEER, REQUESTOR) using Playwright automation
- **Multi-Step Form Validation**: Ensured complete ECR creation workflow functions properly from problem identification through submission
- **Error Handling Enhancement**: Added proper null/undefined validation in permissions functions to prevent future crashes

### Authentication System Fixes & Database Schema Alignment
- **8-Role User System**: Implemented comprehensive role-based access control with ADMIN, MANAGER, ENGINEER, QUALITY, MANUFACTURING, REQUESTOR, DOCUMENT_CONTROL, VIEWER roles
- **Database Schema Cleanup**: Removed non-existent fields (department, technicalAssessment, etc.) and aligned API routes with actual schema
- **Login Page Enhancement**: Added all 8 test account credentials with clickable auto-fill functionality for easy demo access
- **API Route Fixes**: Fixed ECR creation functionality by removing references to non-existent database fields
- **Authentication Flow**: Resolved field mismatch errors between API queries and database schema structure

### Revision History & Dark Mode Implementation
- **Comprehensive Revision Tracking**: Added dedicated revision models for ECR, ECO, and ECN with field-level change detection
- **RevisionHistory Component**: Interactive expandable UI showing before/after values with user attribution and timestamps
- **Accurate Change Detection**: Only tracks actual field changes, preventing false revision entries
- **Dark Mode Support**: Complete dark mode implementation across all detail pages, filters, and components
- **Mobile-First Design**: Responsive revision history with proper mobile styling and dark mode support

### UI/UX Workflow Enhancement
- **Modal Removal**: Eliminated modal popups from ECO and ECN kanban views for better user experience
- **Direct Navigation**: Implemented seamless navigation to dedicated detail pages
- **Next Step Workflow**: Added prominent workflow buttons with status progression indicators
- **Visual Progress**: Enhanced detail pages with comprehensive status tracking and progress bars
- **API Validation**: Strengthened ECO and ECN status update endpoints with proper validation

### Phase 1 Field Enhancements
- **Enhanced Schema**: Added comprehensive enums and fields for priority, customer impact, cost analysis, and quality management
- **Clean Slate Implementation**: Complete database schema refresh with Phase 1 fields (no backwards compatibility)
- **Form Updates**: All ECR, ECO, and ECN forms enhanced with Phase 1 field validation and organization
- **List Views**: Updated tables with Phase 1 columns, filters, and color-coded priority/impact indicators

### Analytics Dashboard
- **Priority Breakdown**: Pie chart showing distribution of Critical/High/Medium/Low priorities
- **Customer Impact**: Visual summary of Direct/Indirect/No Impact changes
- **Implementation Status**: Bar chart tracking ECO progress through phases
- **Quick Filters**: My Items, High Priority, Customer Impact, and This Week's Targets
- **Chart.js Integration**: Interactive visualizations with responsive design

### Export & Communication Features
- **CSV/Excel Export**: Complete Phase 1 data export with proper formatting
- **Email Templates**: Five comprehensive notification templates (ECR submitted, approved, rejected, ECO created, ECN published)
- **HTML/Text Formats**: Professional email styling with fallback text versions

### Bug Fixes & Deployment
- **Cache Management**: Resolved persistent JSX syntax errors through comprehensive cache clearing
- **Runtime Fixes**: Fixed null reference errors and missing imports in ECO/ECN detail pages
- **Database Compatibility**: Fixed ECO creation from ECR API (urgency→priority field updates)
- **Authentication Flow**: Resolved duplicate login pages and session handling
- **Development Server**: Automated startup and demo credentials integration

## 📊 Current Status

✅ **Production Ready**
- Complete authentication system with demo credentials
- Full ECR→ECO→ECN workflow with Phase 1 enhancements
- Responsive design with mobile optimization
- Real data integration with PostgreSQL/Prisma
- Comprehensive traceability and analytics dashboard
- Export functionality and email notifications

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📄 Documentation

- See `PROGRESS.md` for detailed development history
- Database schema in `prisma/schema.prisma`
- API endpoints in `app/api/` directory

---

*Last updated: 2025-09-02 - Critical ECR Creation Bug Fix*