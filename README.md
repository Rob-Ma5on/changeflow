# ChangeFlow - Engineering Change Management System

ChangeFlow is a comprehensive Engineering Change Management system designed for small manufacturing companies to efficiently track and manage engineering changes throughout the product lifecycle.

## Overview

ChangeFlow helps organizations manage three critical types of engineering change documents:

### 📋 ECR (Engineering Change Request)
Initial requests for engineering changes that identify potential improvements, corrections, or modifications to existing designs, processes, or documentation.

### 📝 ECO (Engineering Change Order) 
Formal authorizations that approve and detail the specific changes to be implemented, including scope, timeline, and resources required.

### 📄 ECN (Engineering Change Notice)
Official notifications that communicate completed changes to all stakeholders, documenting what was changed, when, and by whom.

## Features

- **Change Request Management**: Create, track, and review ECRs with proper approval workflows
- **Change Order Processing**: Convert approved ECRs to ECOs with detailed implementation plans
- **Change Notice Distribution**: Generate and distribute ECNs to notify stakeholders of completed changes
- **Document Version Control**: Track all revisions and maintain change history
- **Approval Workflows**: Configurable approval processes for different change types
- **Impact Assessment**: Evaluate the impact of changes on products, processes, and documentation
- **Audit Trail**: Complete tracking of all change activities for compliance and review

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Code Quality**: ESLint

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
changeflow/
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## Development

You can start editing the application by modifying files in the `app/` directory. The page auto-updates as you edit files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load fonts.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - learn about TypeScript
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about utility-first CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.