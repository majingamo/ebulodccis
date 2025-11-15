# PHP Backend Setup Guide

## Overview

The PHP backend uses Firebase REST API to interact with Firestore. This is a simpler approach that doesn't require Composer or Firebase Admin SDK setup.

## Architecture

```
Client (HTML/JS) → PHP API (api/*.php) → Firebase Firestore (REST API)
```

## How It Works

1. **Client-side JavaScript** (`js/api.js`) makes fetch requests to PHP endpoints
2. **PHP endpoints** (`api/*.php`) handle business logic and communicate with Firestore via REST API
3. **Firebase Firestore** stores all data

## Setup Requirements

1. **XAMPP** (PHP server) - Already installed
2. **PHP cURL extension** - Usually included with XAMPP
3. **Session support** - Enabled by default in PHP

## API Endpoints

### Equipment API (`api/equipment.php`)
- `GET /api/equipment.php` - Get all equipment
- `GET /api/equipment.php?id={id}` - Get single equipment
- `POST /api/equipment.php` - Create equipment
- `PUT /api/equipment.php` - Update equipment
- `DELETE /api/equipment.php?id={id}` - Delete equipment

### Requests API (`api/requests.php`)
- `GET /api/requests.php` - Get all requests
- `GET /api/requests.php?borrowerId={id}` - Get borrower's requests
- `GET /api/requests.php?status={status}` - Get requests by status
- `POST /api/requests.php` - Create request
- `PUT /api/requests.php` - Update request (approve, reject, return, cancel)

### Dashboard API (`api/dashboard.php`)
- `GET /api/dashboard.php?type=stats` - Get dashboard statistics
- `GET /api/dashboard.php?type=recent_activity` - Get recent activity

### Borrowers API (`api/borrowers.php`)
- `GET /api/borrowers.php` - Get all borrowers
- `GET /api/borrowers.php?id={id}` - Get borrower details
- `GET /api/borrowers.php?search={term}` - Search borrowers

### Notifications API (`api/notifications.php`)
- `GET /api/notifications.php` - Get notifications
- `PUT /api/notifications.php` - Mark notification as read

### History API (`api/history.php`)
- `GET /api/history.php?equipmentId={id}` - Get equipment history

### Auth API (`api/auth.php`)
- `POST /api/auth.php` - Login
- `GET /api/auth.php` - Check authentication status
- `DELETE /api/auth.php` - Logout

## Authentication

The API uses PHP sessions for authentication:
- After login, session stores `userId` and `userRole`
- All API endpoints check authentication
- Admin endpoints require `userRole === 'admin'`

## Usage in JavaScript

```javascript
// Get all equipment
const equipment = await EquipmentAPI.getAll();

// Create equipment
await EquipmentAPI.create({
  name: 'Laptop',
  category: 'Electronics',
  status: 'Available',
  condition: 'Good',
  location: 'Lab 1'
});

// Get dashboard stats
const stats = await DashboardAPI.getStats();
```

## File Structure

```
EBulod/
├── api/
│   ├── config.php          # Configuration and helpers
│   ├── equipment.php       # Equipment endpoints
│   ├── requests.php        # Request endpoints
│   ├── borrowers.php       # Borrower endpoints
│   ├── dashboard.php       # Dashboard endpoints
│   ├── notifications.php   # Notification endpoints
│   ├── history.php         # History endpoints
│   └── auth.php            # Authentication endpoints
├── js/
│   └── api.js              # JavaScript API client
└── admin_dashboard.html    # Updated to use PHP API
```

## Important Notes

1. **Session-Based**: Uses PHP sessions, so requests must include `credentials: 'include'`
2. **CORS**: Currently allows all origins (update for production)
3. **Firebase REST API**: Uses Firebase REST API (no Admin SDK needed)
4. **Error Handling**: All endpoints return JSON with `success` and `error` fields

## Testing

### Test Equipment API:
```bash
# Get all equipment
curl http://localhost/EBulod/api/equipment.php

# Get single equipment
curl http://localhost/EBulod/api/equipment.php?id=DOCUMENT_ID
```

### Test Auth API:
```bash
# Login
curl -X POST http://localhost/EBulod/api/auth.php \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"admin1\",\"password\":\"password123\"}" \
  -c cookies.txt

# Check auth
curl http://localhost/EBulod/api/auth.php -b cookies.txt
```

## Troubleshooting

### Error: "Unauthorized"
- Make sure you're logged in (session exists)
- Check that requests include `credentials: 'include'`
- Verify session is working

### Error: "CORS error"
- Make sure you're accessing via `http://localhost/EBulod/` not `file://`
- Check CORS headers in `api/config.php`

### Error: "Firestore API error"
- Check Firebase API key in `api/config.php`
- Verify Firebase project ID is correct
- Check internet connection (REST API requires internet)

## Next Steps

1. Update `admin_dashboard.html` to use PHP API (remove direct Firebase calls)
2. Update `borrower_dashboard.html` to use PHP API
3. Test all functionality
4. Update authentication flow to use PHP sessions

