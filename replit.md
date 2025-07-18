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
- January 11, 2025. ADVANCED SCHEDULING FEATURE: Implemented comprehensive advanced scheduling with date ranges, day-of-week selection, time windows, timezone awareness, and randomized non-repeating time slots
- January 11, 2025. CUSTOM SUBJECT LINE FEATURE: Added campaign-level custom subject lines with personalization variables ({{name}}, {{company}}, {{sender_name}}, {{email}}) and live preview functionality
- January 11, 2025. INBOX REMOVAL FEATURE: Implemented comprehensive inbox removal with strict guarantees including OAuth token revocation, queue cancellation, campaign validation, double-confirmation dialogs, and fail-safe enforcement
- January 11, 2025. ENHANCED RSVP TRACKING: Implemented comprehensive RSVP acceptance tracking system with database schema updates (rsvp_events, webhook_events tables), real-time status monitoring, webhook integration, activity log filtering, and enhanced campaign statistics displaying acceptance/decline/tentative rates
- January 11, 2025. CAMPAIGN-LEVEL RATE LIMITING: Removed global system limits and implemented campaign-specific rate controls with maxInvitesPerInbox and maxDailyCampaignInvites fields, added UI controls for setting per-inbox daily limits and campaign daily limits, enforced 30-minute mandatory cooldown between sends per inbox with 100% compliance, updated queue manager to use campaign-specific limits instead of global limits
- January 11, 2025. COMPLETE INBOX DELETION: Updated inbox removal feature to permanently delete inboxes from platform instead of marking inactive, modified storage methods to use database DELETE operations, updated UI dialogs to clearly indicate permanent deletion, enhanced OAuth token revocation and queue cancellation, inboxes now completely disappear from all lists and interfaces after removal
- January 12, 2025. COMPREHENSIVE ACTIVITY LOG SYSTEM: Enhanced activity logs database schema with comprehensive event tracking fields (eventType, action, description, severity, inboxId, inboxType, recipientEmail, recipientName), created centralized ActivityLogger service with structured logging methods for invite events, inbox events, campaign events, and system events, implemented sophisticated filtering system with search, date ranges, event types, severity levels, and recipient filtering
- January 12, 2025. DYNAMIC ACTIVITY LOG UI: Built comprehensive activity log timeline page with real-time updates, advanced filtering controls, search functionality, pagination with infinite scroll, CSV export capability, expandable event details with metadata display, visual timeline with provider icons and severity indicators, and statistics dashboard showing event counts and system health metrics
- January 12, 2025. COMPREHENSIVE INBOX MANAGEMENT: Created dedicated inbox management page with visual status monitoring, connection health testing, account reconnection workflows, comprehensive account statistics with usage tracking and cooldown status, provider-specific account cards for Google and Microsoft accounts, and centralized management interface with automated health checks every 30 seconds
- January 12, 2025. UNIFIED INBOX MANAGEMENT: Merged Inbox Setup and Inbox Management into a single comprehensive interface (unified-inbox-management.tsx) with tabbed navigation featuring Overview, Accounts, Add Account, and Test Invites tabs, combining all OAuth setup, account management, connection testing, and test invite functionality into one cohesive page, updated sidebar navigation to show single "Inboxes" link instead of separate setup/management links
- January 12, 2025. CRITICAL SCHEDULING FIXES: Fixed "Add Account" feature by correcting OAuth endpoint from /api/auth/google to /api/oauth-calendar/auth, enforced user-required calendar scheduling logic with minimum 2-day gap between invite creation and scheduled meeting time (was previously 1-2 minutes), updated default time window from 9AM-5PM to 12PM-4PM as per user requirements for professional meeting scheduling
- January 12, 2025. COMPREHENSIVE SCHEDULING SYSTEM: Built dedicated scheduling management system with dashboard-level and campaign-level interfaces, created scheduling-service.ts with advanced time slot management, timezone-aware scheduling with business hours compliance, added comprehensive scheduling API endpoints for settings, statistics, and invite management, integrated scheduling navigation in sidebar, created database tables (scheduled_invites, scheduling_settings) for advanced scheduling control
- January 12, 2025. NAVIGATION IMPROVEMENTS: Updated sidebar navigation to rename "Inboxes" to "Inbox Setup" for clarity, merged "Activity" into "Activity Log" to consolidate activity tracking, fixed Google account connection issue by adding missing /api/auth/google/url endpoint with proper OAuth URL generation, resolved dead link problem in account setup flow
- January 12, 2025. GOOGLE OAUTH CONNECTION FIXED: Resolved Google OAuth authentication issues by updating credentials to working "Kally" project (571943054804), disabled failing service account authentication, added complete OAuth callback route (/api/auth/google/callback) with token exchange and account creation, verified OAuth URL generation working with proper redirect URI, system now ready for Google account reconnection
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```