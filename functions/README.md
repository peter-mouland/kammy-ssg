# Firebase Functions

## Required `.env`

```dotenv
# Google Sheets Configuration
GOOGLE_SHEETS_ID=

# base64 encoded
GOOGLE_SERVICE_ACCOUNT_KEY=[base64 encodedn json key]


# Optional: FPL API Rate Limiting
FPL_API_DELAY=1000

# Setup Instructions:
# 1. Create a Google Cloud Project
# 2. Enable Google Sheets API
# 3. Create a Service Account and download JSON key
# 4. Share your Google Sheet with the service account email
# 5. Copy the spreadsheet ID from the URL
# 6. Set environment variables in Vercel/your hosting platform

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

```
