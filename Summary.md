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
- **Styling**: Tailwind CSS with custom color scheme
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
- **FilterBar**: Universal filtering with mobile collapse and Phase 1 filters
- **EntityCard**: Consistent card layout with Phase 1 field display
- **ColumnHeader**: Sortable table headers with visual indicators
- **Analytics Charts**: Priority breakdowns, customer impact, and implementation status

## 📱 Mobile Features

- **Responsive Navigation**: Collapsible sidebar with overlay
- **Smart Column Hiding**: Less important columns hidden on small screens
- **Touch-Friendly**: Optimized buttons and touch targets
- **Scrollable Tables**: Horizontal scroll for table overflow

## 🚀 Recent Updates (Latest: Phase 1 Implementation)

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

*Last updated: 2025-08-27 - Phase 1 Implementation with Enhanced Analytics and Export Features*