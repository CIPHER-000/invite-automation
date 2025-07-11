# Shady 5.0 - Calendar Invite Campaign Automation System

## Overview

Shady 5.0 is a comprehensive multi-provider calendar automation platform that supports both Google Workspace and Microsoft 365/Outlook integration. The system provides intelligent campaign management, smart time slot scheduling, advanced load balancing, and multi-provider email capabilities. It allows users to create and manage sophisticated email marketing campaigns that automatically send personalized calendar invitations to prospects from Google Sheets data, with support for multiple calendar providers and comprehensive performance tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Google OAuth2 with multiple account support
- **Background Processing**: Custom queue manager for asynchronous task processing

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon serverless driver for PostgreSQL connections

## Key Components

### Database Schema
The system uses five main tables:
- **google_accounts**: Stores OAuth tokens and account information for multiple Google accounts
- **campaigns**: Campaign configurations with templates and Google Sheets integration
- **invites**: Individual invite records with status tracking and merge data
- **activity_logs**: System activity and audit trail
- **invite_queue**: Background job queue for processing invites
- **system_settings**: Global system configuration

### Google API Integrations
- **Google OAuth2**: Multi-account authentication with refresh token management
- **Google Calendar API**: Calendar event creation and invite management
- **Google Sheets API**: Reading prospect data and updating status information

### Background Processing System
- **Queue Manager**: Processes invite queue with configurable intervals
- **Campaign Processor**: Reads Google Sheets and creates invite jobs
- **Email Service**: Sends confirmation emails using nodemailer
- **Status Tracking**: Monitors invite acceptance and updates records

### UI Components
- **Dashboard**: Real-time statistics and system health monitoring
- **Campaign Management**: Create, edit, and monitor campaigns
- **Account Management**: Connect and manage multiple Google accounts
- **Activity Log**: Real-time activity tracking and filtering
- **Settings**: System configuration and limits management

## Data Flow

1. **Campaign Creation**: Users create campaigns with Google Sheets URLs and email templates
2. **Sheet Processing**: System reads prospect data from Google Sheets using Google Sheets API
3. **Queue Population**: Prospects are added to the invite queue with scheduled send times
4. **Invite Processing**: Background queue manager processes pending invites
5. **Calendar Event Creation**: System creates calendar events and sends invites via Google Calendar API
6. **Status Updates**: Google Sheets are updated with invite status and timestamps
7. **Acceptance Monitoring**: System periodically checks for invite acceptances
8. **Confirmation Emails**: Automated confirmation emails are sent upon acceptance

## External Dependencies

### Google APIs
- **Google Calendar API**: For creating calendar events and managing invitations
- **Google Sheets API**: For reading prospect data and updating status information
- **Google OAuth2 API**: For user authentication and token management

### Third-party Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Nodemailer**: Email sending functionality with Gmail integration

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Monitoring**: Runtime error overlay for development

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local PostgreSQL or Neon development instance
- **Environment Variables**: Google OAuth credentials and database URL

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild compilation to ESM format with external packages
- **Database**: Drizzle migrations applied to production PostgreSQL instance
- **Deployment**: Node.js server serving built frontend and API endpoints

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL

## Changelog
```
Changelog:
- June 28, 2025. Initial setup with Google Calendar automation
- June 28, 2025. Added Dynamic Time Slot Logic with timezone-aware scheduling
- June 28, 2025. Implemented Inbox Load Balancing with health scoring and auto-rotation
- June 28, 2025. Added Office 365/Outlook integration with Microsoft Graph API
- June 28, 2025. Created Multi-Provider Email services supporting Gmail and Outlook
- June 28, 2025. Rebranded to "Shady 5.0" with enhanced multi-provider capabilities
- June 30, 2025. Successfully configured Google Service Account authentication
- June 30, 2025. Enabled Google Calendar API and Google Sheets API access
- June 30, 2025. Deployed working calendar automation system with access code protection
- June 30, 2025. Implemented hybrid authentication model: Service Account + App Passwords
- June 30, 2025. Integrated organizational user management with Gmail app password requirements
- June 30, 2025. Added inbox selection functionality to campaign creation
- June 30, 2025. Unified account setup page combining service account and user management
- January 1, 2025. Built comprehensive OAuth 2.0 Calendar Integration system
- January 1, 2025. Resolved Domain-Wide Delegation barriers with direct OAuth authentication
- January 1, 2025. Deployed production-ready OAuth calendar functionality bypassing admin setup requirements
- January 1, 2025. Configured correct OAuth credentials from project new-app-464423 with fresh client secret
- January 1, 2025. Enabled Google Calendar API and Sheets API via gcloud commands for OAuth functionality
- January 7, 2025. PRODUCTION SUCCESS: OAuth calendar integration fully operational with "Kally" project
- January 7, 2025. Successfully connected Google account (dhairyashil@gmail.com) using OAuth 2.0 flow
- January 7, 2025. Resolved "invalid_client" authentication issues with correct client credentials
- January 7, 2025. Campaign processor updated to use OAuth accounts for calendar invite sending
- January 7, 2025. CAMPAIGN AUTOMATION WORKING: Fixed time slot scheduling logic to use immediate scheduling instead of next-business-day
- January 7, 2025. Queue manager successfully processing invites with OAuth calendar integration (Event ID: 7l469sgigbac3c97nf0e2rjf4c sent to shaw@getmemeetings.com)
- January 7, 2025. Calendar invite campaigns now fully operational with OAuth-authenticated Google accounts
- January 7, 2025. Updated invite scheduling to send invites 1 minute after campaign creation for immediate automation
- January 7, 2025. Implemented safe campaign deletion with processing checks and visual indicators
- January 7, 2025. OAuth integration working correctly - Google unverified app warning is expected for development apps
- January 8, 2025. Renamed "OAuth Calendar" to "Inbox Setup" throughout the application
- January 8, 2025. Restructured dashboard to show campaigns as full-width vertical cards with better metrics display
- January 8, 2025. Added sender name variable feature for personalized campaign messaging using {{sender_name}} merge field
- January 11, 2025. CRITICAL FIXES: Fixed 30-minute minimum gap enforcement (was sending every 30 seconds instead of 30 minutes)
- January 11, 2025. CRITICAL FIXES: Fixed inbox selection enforcement - now only uses campaign's selected inboxes instead of any available inbox
- January 11, 2025. CRITICAL FIXES: Fixed campaign pause/stop functionality - now properly cancels pending queue items when campaigns are paused
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```