# FPL React Router v7 Tracker - Setup Guide

A modern Fantasy Premier League tracking application built with React Router v7, Google Sheets API, and real-time updates.

## 🚀 Features

- **Real-time FPL Data** - Live player stats and scores
- **Google Sheets Integration** - Store custom league data
- **Server-Sent Events** - Real-time notifications
- **League Management** - Track multiple managers
- **Weekly Points History** - Historical performance data
- **Responsive Design** - Works on all devices

## 📋 Google Sheets Setup

### 1. Create Google Cloud Project
```bash
# Go to Google Cloud Console (https://console.cloud.google.com)
# Create new project or select existing
# Enable Google Sheets API in the API Library
```

### 2. Create Service Account
```bash
# In Google Cloud Console:
# Navigate to IAM & Admin > Service Accounts
# Click "Create Service Account"
# Give it a name (e.g., "fpl-tracker-service")
# Grant "Editor" role (or create custom role with Sheets access)
# Create and download JSON key file
```

### 3. Setup Google Sheet
```bash
# Create new Google Sheet
# Add two sheets: "UserTeams" and "WeeklyPoints"
# Share sheet with service account email (found in JSON key)
# Give "Editor" permissions to the service account
# Copy spreadsheet ID from URL:
# https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### 4. Environment Variables
```bash
# In Vercel/hosting platform or .env.local:
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
```

### 5. Sheet Structure
The application automatically creates headers when you first run it:

**UserTeams Sheet:**
| User ID | User Name | Team Name | FPL ID | Current GW Points | Total Points | Overall Rank | League Rank | Last Updated |
|---------|-----------|-----------|--------|-------------------|--------------|--------------|-------------|--------------|

**WeeklyPoints Sheet:**
| User ID | Gameweek | Points | Transfers | Hits | Captain | Vice Captain | Bench Boost | Triple Captain | Wildcard | Free Hit | Date Recorded |
|---------|----------|--------|-----------|------|---------|--------------|-------------|----------------|----------|----------|---------------|

## 🔧 Development

```bash
# Clone or create the project
npx create-react-router@latest fpl-app
cd fpl-app

# Install dependencies
npm install googleapis

# Copy all the files from the template
# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - GOOGLE_SHEETS_ID
# - GOOGLE_SERVICE_ACCOUNT_KEY
```

### Other Platforms
- **Netlify**: Works with environment variables
- **Railway**: Good for full-stack deployment
- **Render**: Free tier supports Node.js apps

## 📊 API Endpoints

- `GET /` - Main dashboard with top players
- `GET /my-team` - League management interface
- `GET /api/live-scores` - Server-Sent Events stream
- `POST /api/sheets` - Google Sheets operations
- `GET/POST /api/user-data` - User data management
- `POST /api/cron` - Scheduled data updates

## 🔄 Automated Updates

The application includes cron job support for:
- Fetching latest FPL data every 10 minutes
- Updating Google Sheets with fresh scores
- Sending notifications for significant changes

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

## 🎯 Key Features to Implement

1. **Add League Members**: Use the "Add Manager" form to add FPL IDs
2. **Sync FPL Data**: Click "Sync FPL Data" to fetch latest scores
3. **View Live Updates**: Real-time score notifications on dashboard
4. **Historical Tracking**: Weekly points stored automatically

## 🔍 Troubleshooting

### Common Issues:

**"Failed to fetch user data"**
- Check Google Sheets API is enabled
- Verify service account has access to the sheet
- Ensure environment variables are set correctly

**"Invalid credentials"**
- Double-check the service account JSON key
- Make sure the JSON is properly formatted in environment variable
- Verify the service account email has sheet access

**"Spreadsheet not found"**
- Confirm the spreadsheet ID is correct
- Check the sheet is shared with the service account email
- Ensure the sheet has the correct tab names: "UserTeams" and "WeeklyPoints"

**Real-time updates not working**
- Check browser console for SSE connection errors
- Verify the `/api/live-scores` endpoint is accessible
- Some ad blockers may block Server-Sent Events

### Debug Tips:

1. **Test Google Sheets connection**:
   ```bash
   # Visit /api/sheets with action=initialize in form data
   # This will create headers and test the connection
   ```

2. **Check FPL API responses**:
   ```bash
   # Test FPL API directly:
   curl https://fantasy.premierleague.com/api/bootstrap-static/
   ```

3. **Monitor server logs**:
   ```bash
   # In development:
   npm run dev
   # Check console for detailed error messages
   ```

## 🎯 Next Steps

### Recommended Enhancements:

1. **Firebase Push Notifications**
    - Send notifications when players score
    - Alert when league positions change
    - Weekly summary notifications

2. **Advanced Analytics**
    - Player price change tracking
    - Transfer recommendations
    - League performance charts

3. **Mobile Optimizations**
    - Progressive Web App (PWA)
    - Push notification support
    - Offline data caching

4. **League Features**
    - Head-to-head comparisons
    - Weekly awards (highest scorer, worst captain, etc.)
    - League-specific player recommendations

### File Structure:
```
app/
├── lib/
│   └── sheets.ts             # Google Sheets integration
├── routes/
│   ├── home.tsx              # Main dashboard
│   ├── league-standings.tsx           # League management
│   ├── player.tsx            # Player details
│   ├── api.live-scores.ts    # Server-Sent Events
│   ├── api.sheets.ts         # Sheets API operations
│   ├── api.user-data.ts      # User data management
│   └── api.cron.ts           # Scheduled updates
├── routes.ts                 # Route configuration
├── root.tsx                  # App shell
└── react-router.config.ts    # Framework config
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test thoroughly
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Fantasy Premier League for providing the API
- React Router team for the excellent v7 framework
- Google Sheets API for free data storage
- Vercel for generous free hosting
