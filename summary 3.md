# ChangeFlow - Engineering Change Management System

## Overview
ChangeFlow is a complete engineering change management system built with Next.js 15, implementing the full ECR→ECO→ECN workflow with comprehensive traceability and mobile-responsive design.

## 🎯 Core Features

### Engineering Change Workflow
- **ECR (Engineering Change Request)**: Initial change requests with approval workflow
- **ECO (Engineering Change Order)**: Implementation tracking with multi-ECR bundling
- **ECN (Engineering Change Notice)**: Formal notification of completed changes
- **Complete Traceability**: Full audit trail from request to implementation

### User Interface
- **Unified Design System**: Consistent components across all sections
- **Dark Mode Support**: Complete dark theme implementation with system preference detection
- **Dual View Modes**: Kanban boards and sortable list tables
- **Mobile Responsive**: Optimized for all screen sizes
- **Real-time Dashboard**: Live statistics and recent activity
- **Skeleton Loading**: Animated loading states matching actual content structure

### Key Workflows
1. **ECR Creation & Approval**: Submit → Review → Approve/Reject
2. **ECR Bundling**: Multi-select approved ECRs for coordinated implementation
3. **ECO Management**: Track implementation progress with status updates
4. **ECN Generation**: Automatic creation with matching numbers (ECO-2025-001 → ECN-2025-001)
5. **Universal Search**: Find any item by number for complete traceability

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with custom color scheme
- **Deployment**: Vercel-ready configuration

## 🎨 Design System

### Color Scheme
- **Primary**: #0066CC (buttons, active states, links)
- **ECR Accent**: #3B82F6 (blue)
- **ECO Accent**: #10B981 (green)  
- **ECN Accent**: #F59E0B (amber)
- **Priority High/Medium/Low**: #EF4444/#EAB308/#22C55E

### Components
- **ViewToggle**: Kanban/List view switching
- **FilterBar**: Universal filtering with mobile collapse
- **EntityCard**: Consistent card layout for all entity types
- **ColumnHeader**: Sortable table headers with visual indicators

## 📱 Mobile Features

- **Responsive Navigation**: Collapsible sidebar with overlay
- **Smart Column Hiding**: Less important columns hidden on small screens
- **Touch-Friendly**: Optimized buttons and touch targets
- **Scrollable Tables**: Horizontal scroll for table overflow

## 🚀 Recent Updates (Latest Commit: 08b4263)

### Complete Dark Mode Implementation (Latest)
- **System Integration**: Added Tailwind CSS dark mode with class-based switching 
- **Theme Context**: React Context provider with localStorage persistence and system preference detection
- **Theme Toggle Component**: Accessible toggle button available in both desktop sidebar and mobile menu
- **Comprehensive Coverage**: Dark mode applied across all major pages:
  - Dashboard main page with metrics cards and activity feed
  - ECO dashboard with kanban boards and list views
  - ECN dashboard with complete dark styling
  - Traceability search page with chain visualization
- **Enhanced Skeleton Loading**: Replaced simple spinners with comprehensive animated placeholders
  - ECO dashboard: Full skeleton matching actual kanban and table structures
  - ECN dashboard: Detailed loading states for all content sections
  - Consistent dark mode colors for all skeleton elements
- **Design Consistency**: Maintained purple, blue, yellow, green accent colors with dark variants
- **User Experience**: Smooth theme transitions with proper contrast ratios and accessibility

### Enhanced Workflow & UI Experience
- **Modal Removal**: Removed modal popup functionality from ECO and ECN kanban views, replaced with direct navigation to detail pages for improved user flow
- **Prominent Workflow Buttons**: Added "Next Step" workflow buttons to ECO and ECN detail pages with visual progress indicators
- **Visual Progress Tracking**: 
  - ECO: 7-stage progress bar (Draft → Submitted → Approved → Backlog → In Progress → Review → Completed)
  - ECN: 5-stage progress indicator (Draft → Pending Approval → Approved → Distributed → Effective)
- **Enhanced Detail Pages**: Expanded ECO and ECN detail views with comprehensive field display in responsive 3-column layouts
- **API Route Validation**: Added proper enum validation to ECO and ECN status update endpoints for data integrity

### Next.js 15 & Vercel Deployment Compatibility
- **NextAuth Route Fix**: Moved `authOptions` configuration to separate `lib/auth.ts` file for Next.js 15 App Router compliance
- **Route Export Cleanup**: Updated NextAuth route to only export GET/POST handlers as required by App Router
- **Import Updates**: Fixed 12+ API routes to import authOptions from new centralized auth config location
- **TypeScript Fixes**: Resolved all Prisma typing conflicts using strategic `any` typing for dynamic objects
- **Async Params Handling**: Updated ECO detail page for Next.js 15 async params requirement
- **Null Safety**: Added optional chaining and null checks throughout UI components
- **Vercel Build Success**: All TypeScript compilation errors resolved for production deployment

### Comprehensive Workflow Guidance & Validation
- **Info Banners**: Added contextual guidance banners to ECR, ECO, and ECN pages
  - ECR: Blue banner explaining workflow start
  - ECO: Amber banner with link to approved ECRs
  - ECN: Purple banner with link to completed ECOs
- **Visual Status Indicators**: "Ready for ECO conversion" badges for approved ECRs
- **Enhanced Empty States**: Meaningful messages with clear next steps when no records exist

### Linear Workflow Enforcement
- **Form-Based Conversion**: Replaced auto-creation with guided forms for ECR→ECO and ECO→ECN
- **Validation Rules**: 
  - Only APPROVED ECRs can be converted to ECOs
  - Only COMPLETED ECOs can generate ECNs
  - Clear error messages for invalid workflow attempts
- **Deprecated Auto-Creation**: API endpoints return 410 Gone with redirect guidance

### Enhanced Navigation Components
- **WorkflowBreadcrumbs**: Visual navigation showing ECR→ECO→ECN path with clickable completed steps
- **WorkflowProgress**: 3-step progress indicator with animations for creation forms
- **Responsive Design**: Both desktop horizontal and mobile vertical layouts

### Comprehensive Dashboard Enhancements
- **Phase 1 Metrics**: Priority breakdown, customer impact summary, implementation status charts
- **Interactive Charts**: Pie, doughnut, and bar charts using Chart.js
- **Quick Filters**: My Items, High Priority, Customer Impact, Due This Week
- **This Week's Targets**: ECRs and ECOs with upcoming target dates
- **Enhanced Activity Feed**: Recent activity with priority and customer impact badges

### Database & API Fixes
- **Field Migration**: Fixed all references from deprecated 'urgency' to 'priority' field
- **Complete API Response**: Dashboard API now returns all required fields for frontend
- **Improved Error Handling**: Better validation and error messages throughout workflow

## 📊 Current Status

✅ **Production Ready & Deployed**
- Complete authentication system with NextAuth.js
- Full ECR→ECO→ECN workflow with linear enforcement
- Responsive design implemented across all screen sizes
- Real data integration with PostgreSQL via Prisma
- Comprehensive traceability with universal search
- **Vercel Deployment**: Successfully deployed with Next.js 15 compatibility

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

*Last updated: 2025-08-30 - Complete Dark Mode Implementation & Enhanced Loading States*