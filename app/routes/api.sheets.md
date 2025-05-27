# 🎯 API Actions Available:

## Core Operations:

- initialize - Sets up Google Sheets with proper headers
- get_users - Retrieves all league member data
- update_user - Adds or updates a single user
- sync_fpl_data - Fetches latest FPL scores for all users

## Advanced Operations:

- bulk_add_users - Add multiple users at once
- delete_user - Remove a specific user from the league
- reset_league - Clear all user data (use carefully!)

## Testing:

`GET /api/sheets?action=test` - Test Google Sheets connection

## 🔧 How Each Action Works:

### sync_fpl_data (Most Important):

Gets all users from Google Sheets
For each user with an FPL ID:

Fetches their latest data from https://fantasy.premierleague.com/api/entry/{fpl_id}/
Updates current gameweek points, total points, and overall rank
Sets last updated timestamp


Saves all updated data back to Google Sheets

### update_user:

Accepts user data as JSON in form data
Finds existing user or adds new one
Updates Google Sheets with the new data

### Error Handling:

Graceful fallbacks if FPL API is down
Detailed error messages for debugging
Proper HTTP status codes

## 📝 Usage Examples:
```javascript
// Sync FPL data for all users
const formData = new FormData();
formData.append("action", "sync_fpl_data");
fetch("/api/sheets", { method: "POST", body: formData });

// Add a new user
const userData = {
    user_id: "john123",
    user_name: "John Doe",
    team_name: "John's Team",
    fpl_id: 1234567,
    // ... other fields
};
const formData = new FormData();
formData.append("action", "update_user");
formData.append("userData", JSON.stringify(userData));
fetch("/api/sheets", { method: "POST", body: formData });
```
