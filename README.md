# Shady 5.0 - Calendar Invite Campaign Automation System

A comprehensive multi-provider calendar automation platform that supports both Google Workspace and Microsoft 365/Outlook integration. The system provides intelligent campaign management, smart time slot scheduling, advanced load balancing, and multi-provider email capabilities.

## Features

- **Multi-Provider Support**: Google Calendar and Microsoft 365/Outlook integration
- **Campaign Management**: Create and manage sophisticated email marketing campaigns
- **Smart Scheduling**: Intelligent time slot distribution with timezone awareness
- **Load Balancing**: Advanced inbox rotation and health scoring
- **Real-time Analytics**: Comprehensive dashboard with performance tracking
- **RSVP Tracking**: Monitor invite responses and acceptances
- **User Authentication**: Secure multi-user access with data isolation
- **Time Range Filtering**: Filter metrics and activity logs by custom time periods

## Tech Stack

### Frontend
- React 18 with TypeScript
- Shadcn/ui components with Radix UI primitives
- Tailwind CSS with CSS variables for theming
- TanStack React Query for server state management
- Wouter for client-side routing
- React Hook Form with Zod validation

### Backend
- Node.js with Express.js framework
- TypeScript with ES modules
- PostgreSQL with Drizzle ORM
- Google OAuth2 with multiple account support
- Background queue processing

### APIs & Integrations
- Google Calendar API
- Google Sheets API
- Google OAuth2 API
- Microsoft Graph API (Office 365)
- Nodemailer for email functionality

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Cloud Project with Calendar and Sheets APIs enabled
- OAuth 2.0 credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shady-calendar-automation.git
cd shady-calendar-automation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy and edit the environment file
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Usage

1. **Account Setup**: Connect your Google accounts through the OAuth flow
2. **Campaign Creation**: Create campaigns with Google Sheets integration
3. **Template Configuration**: Set up email templates with merge fields
4. **Schedule Management**: Configure time slots and sending intervals
5. **Monitor Performance**: Use the dashboard to track campaign metrics

## API Documentation

The system provides a RESTful API with the following main endpoints:

- `GET /api/dashboard/stats?days=30` - Dashboard statistics with time filtering
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/activity?days=7` - Activity logs with time filtering
- `GET /api/invites` - List invites with status tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue on GitHub or contact the development team.