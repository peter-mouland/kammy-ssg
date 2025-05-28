# Fantasy Football Draft Application

A comprehensive React Router v7 application for managing division-based fantasy football drafts with Google Sheets as the database and FPL API integration.

## Features

### Core Functionality
- **Division-based League System**: Organize teams into separate divisions
- **Snake Draft System**: Automated draft order with snake format (even rounds reverse order)
- **Real-time Draft Interface**: Live draft room with Server-Sent Events
- **Custom Points System**: Position-based scoring with detailed breakdowns
- **FPL API Integration**: Live player data and statistics
- **Google Sheets Database**: Header-based parsing with robust error handling

### Pages & Routes
- **Dashboard** (`/`) - League overview with top players and standings
- **Team Management** (`/my-team`) - View league standings with division filtering
- **Live Draft** (`/draft`) - Real-time draft interface with player selection
- **Draft Setup** (`/generate-draft`) - Generate draft orders and manage draft state
- **Player Details** (`/player/$playerId`) - Detailed player stats and custom points breakdown

### Technical Features
- **Server-Side Rendering** with React Router v7
- **TypeScript** throughout with comprehensive type definitions
- **Vite** for fast development and building
- **Google Sheets API** integration with service account authentication
- **Header-based Sheet Parsing** for flexible data structure
- **Custom Points Calculation** with position-specific rules
- **Real-time Updates** via Server-Sent Events
- **Responsive Design** with mobile-friendly interface

## Project Structure

```
app/
├── lib/
│   ├── fpl/
│   │   └── api.ts                 # FPL API integration
│   ├── points.ts                  # Custom points calculation system
│   └── sheets/
│       ├── common.ts              # Common Google Sheets utilities
│       ├── divisions.ts           # Divisions sheet management
│       ├── userTeams.ts           # User teams sheet management
│       ├── draft.ts               # Draft picks & state management
│       ├── draftOrder.ts          # Draft order management
│       └── playerStats.ts         # Player statistics management
├── routes/
│   ├── _index.tsx                 # Dashboard page
│   ├── my-team.tsx                # Team management page
│   ├── draft.tsx                  # Live draft interface
│   ├── draft-admin.tsx         # Draft setup page
│   ├── player.$playerId.tsx       # Player detail page
│   ├── api.sheets.ts              # Sheets CRUD API
│   └── api.live-scores.ts         # Server-Sent Events for live updates
├── types/
│   └── index.ts                   # Comprehensive type definitions
└── root.tsx                       # Root layout component
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Google Cloud Console account
- Google Spreadsheet

### 2. Google Sheets Setup

#### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Sheets API
4. Create service account credentials
5. Download JSON key file
6. Base64 encode the JSON: `base64 -i service-account.json`

#### Setup Spreadsheet
1. Create new Google Spreadsheet
2. Share with service account email (from JSON file)
3. Create these sheets with exact names:
    - `Divisions`
    - `UserTeams`
    - `WeeklyPoints`
    - `Draft`
    - `DraftState`
    - `DraftOrder`
    - `PlayerGameweekStats`
    - `PlayerSeasonStats`

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS=your_base64_encoded_credentials
```

### 4. Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Google Sheets Structure

### Divisions Sheet
| Column | Description |
|--------|-------------|
| ID | Unique division identifier |
| Label | Human-readable division name |
| Order | Sort order for divisions |

### UserTeams Sheet
| Column | Description |
|--------|-------------|
| User ID | Unique user identifier |
| User Name | Manager's display name |
| Team Name | Fantasy team name |
| FPL ID | Fantasy Premier League ID |
| Division ID | Division assignment |
| Current GW Points | Latest gameweek points |
| Total Points | Season total points |
| Overall Rank | FPL overall ranking |
| League Rank | Internal league ranking |
| Last Updated | Timestamp of last update |

### Draft Sheet
| Column | Description |
|--------|-------------|
| Pick Number | Sequential pick number |
| Round | Draft round |
| User ID | User making the pick |
| Player ID | FPL player ID |
| Player Name | Player's full name |
| Team | Player's club team |
| Position | Player position |
| Price | Player price in millions |
| Picked At | Timestamp of pick |
| Division ID | Division conducting draft |

### DraftState Sheet
| Column | Description |
|--------|-------------|
| Is Active | Whether draft is currently active |
| Current Pick | Current pick number |
| Current User ID | User whose turn it is |
| Current Division ID | Division currently drafting |
| Total Rounds | Number of rounds in draft |
| Picks Per Team | Picks each team gets |
| Started At | Draft start timestamp |
| Completed At | Draft completion timestamp |

## Custom Points System

### Position-Based Scoring

#### Goalkeepers (GK)
- Goals: 10 points each
- Clean Sheets: 5 points
- Saves: 1 point per 3 saves (after 2nd save)
- Goals Conceded: -1 point per 2 goals
- Red Cards: -3 points

#### Defenders (FB/CB)
- Goals: 8 points each
- Clean Sheets: 5 points
- Goals Conceded: -1 point per 2 goals
- Red Cards: -3 points

#### Midfielders (MID)
- Goals: 5 points each
- Clean Sheets: 3 points
- Red Cards: -5 points

#### Attackers (WA/CA)
- Goals: 4 points each
- Clean Sheets: 0 points
- Red Cards: -5 points

#### Universal Rules
- Appearance: 1 point (<45 min), 3 points (45+ min)
- Assists: 3 points (all positions)
- Yellow Cards: -1 point (all positions)

## API Endpoints

### Sheets API (`/api/sheets`)
- **GET** `?entity=divisions` - Get all divisions
- **GET** `?entity=userTeams` - Get all user teams
- **GET** `?entity=draftPicks&divisionId=X` - Get draft picks for division
- **POST** `?operation=create&entity=division` - Create division
- **POST** `?operation=update&entity=userTeam` - Update user team
- **POST** `?operation=generateDraftOrder` - Generate random draft order

### Live Updates (`/api/live-scores`)
- **GET** `?division=X` - Server-Sent Events stream for live draft updates
- Events: `draft-update`, `pick-made`, `turn-change`, `draft-complete`

## Development Notes

### Key Design Decisions
- **Header-based Parsing**: Flexible sheet structure, column order independent
- **Single Responsibility**: Each sheet handler manages one entity type
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Error Handling**: Robust error boundaries and validation
- **Performance**: Efficient data fetching with parallel requests
- **Real-time**: SSE for live draft updates without polling overhead

### File Organization
- **`/lib/sheets/`**: Individual files per sheet type for maintainability
- **`/lib/points.ts`**: Centralized points calculation logic
- **`/lib/fpl/`**: FPL API integration with caching
- **`/types/`**: Comprehensive type definitions
- **`/routes/`**: Page components and API endpoints

### Custom Points Integration
The points system is fully integrated with player detail pages, showing:
- Real-time calculation using custom rules
- Position-specific breakdown
- Historical gameweek performance
- Season aggregations
- Visual indicators for positive/negative points

## Deployment

### Environment Variables
Ensure these are set in production:
```bash
GOOGLE_SHEETS_ID=your_production_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS=your_base64_service_account_credentials
NODE_ENV=production
```

### Build & Deploy
```bash
npm run build
npm run preview
```

The application is ready for deployment to platforms like Vercel, Netlify, or any Node.js hosting service.

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License - see LICENSE file for details.
