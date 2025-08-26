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
- **Dual View Modes**: Kanban boards and sortable list tables
- **Mobile Responsive**: Optimized for all screen sizes
- **Real-time Dashboard**: Live statistics and recent activity

### Key Workflows
1. **ECR Creation & Approval**: Submit → Review → Approve/Reject
2. **ECR Bundling**: Multi-select approved ECRs for coordinated implementation
3. **ECO Management**: Track implementation progress with status updates
4. **ECN Generation**: Automatic creation with matching numbers (ECO-2025-001 → ECN-2025-001)
5. **Universal Search**: Find any item by number for complete traceability

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with GitHub OAuth
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

## 🚀 Recent Updates (Latest Commit: aea7194)

### Complete ECR Traceability System
- Fixed ECN detail pages to show complete ECR→ECO→ECN traceability chain
- Updated ECN list modal popups to display original ECRs with clickable links
- Enhanced traceability search with linear ECR→ECO→ECN visualization
- Added ECR icons (📝) and improved styling for better UX

### Engineering Change Management Enhancements
- ECR status properly updates to 'IMPLEMENTED' when linked to ECO (not 'CONVERTED')
- Fixed ECN API to include comprehensive ECR data through ECO relationships
- Updated all traceability views to maintain complete engineering change audit trail
- Streamlined ECN display with cleaner linear layout showing full workflow

### Data Integrity & Relationships
- Verified ECR-ECO-ECN database relationships support multiple ECRs per ECO
- Fixed API response patterns to use proper include statements for nested data
- Ensured consistent data structures across all traceability interfaces
- Updated year-based numbering system (YY-### format) working correctly

## 📊 Current Status

✅ **Production Ready**
- Complete authentication system
- Full ECR→ECO→ECN workflow
- Responsive design implemented
- Real data integration
- Comprehensive traceability

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

*Last updated: 2025-08-25 - Complete ECR Traceability System Implementation*