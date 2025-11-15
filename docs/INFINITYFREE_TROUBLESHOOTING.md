# InfinityFree 403 Error Troubleshooting

## Problem
Getting HTTP 403 (Forbidden) errors when trying to approve/reject requests on InfinityFree hosting.

## Root Cause
**InfinityFree FREE plans BLOCK PUT and DELETE HTTP methods!**

The error shows:
- Console: "redirected from 'http://ebulod.xo.je/api/requests.php' to 'https://errors.infinityfree.net/errors/403/'"
- Network: `requests.php` returns 302 (redirect) to InfinityFree's error page
- This happens **BEFORE** our PHP code even runs

InfinityFree intercepts PUT/DELETE requests and redirects them to their error page, which causes CORS errors because the error page doesn't have CORS headers.

## Solution (IMPLEMENTED)
We've changed all PUT/DELETE requests to use POST with an `action` parameter:
- `PUT /api/requests.php` → `POST /api/requests.php` with `{ action: 'approve' }`
- `PUT /api/equipment.php` → `POST /api/equipment.php` with `{ action: 'update' }`
- `DELETE /api/equipment.php` → `POST /api/equipment.php` with `{ action: 'delete' }`

This works because POST requests are allowed on InfinityFree free plans.

## Diagnostic Steps

### Step 1: Test Authentication
1. Upload `api/test_auth.php` to your hosting
2. Open browser console (F12)
3. Run this in console:
```javascript
fetch('api/test_auth.php', {
  headers: {
    'X-User-Id': localStorage.getItem('adminId')
  }
}).then(r => r.json()).then(console.log)
```

This will show:
- If the header is being received
- What userId is detected
- If admin check is working

### Step 2: Check Browser Network Tab
1. Open Developer Tools (F12) → Network tab
2. Try to approve a request
3. Click on the `requests.php` request
4. Check:
   - **Request Headers** → Look for `X-User-Id` header
   - **Response** → See the actual error message
   - **Status Code** → Should show 403

### Step 3: Check Error Response
In the Network tab, click on the failed request and check the **Response** tab. It should show:
```json
{
  "success": false,
  "error": "Unauthorized: Admin access required. User ID: [your adminId], Role: [role]"
}
```

This will tell you:
- What userId was received (or "not provided")
- What role was detected (or "not set")

## Solutions

### Solution 1: Check if Header is Being Sent
The `X-User-Id` header must be sent. Check in browser console:
```javascript
// Check if adminId exists
console.log('Admin ID:', localStorage.getItem('adminId'));

// Test API call manually
fetch('api/test_auth.php', {
  method: 'GET',
  headers: {
    'X-User-Id': localStorage.getItem('adminId')
  }
}).then(r => r.json()).then(console.log);
```

### Solution 2: InfinityFree May Block Custom Headers
Some free hosts block custom headers. Try adding the userId as a query parameter instead.

**Update `js/api.js`:**
```javascript
// Add userId to URL if header doesn't work
const userId = localStorage.getItem('adminId') || localStorage.getItem('borrowerId');
const urlWithAuth = userId ? `${url}?userId=${encodeURIComponent(userId)}` : url;
```

### Solution 3: Check InfinityFree PHP Settings
1. Go to InfinityFree Control Panel
2. Check PHP Settings
3. Ensure:
   - Sessions are enabled
   - Custom headers are allowed
   - No security rules blocking API calls

### Solution 4: Use Session-Based Auth Instead
If headers don't work, we can use a session-based approach:
1. Create a login endpoint that sets PHP session
2. Use session cookies instead of headers

## Quick Fix: Bypass Auth Check (Temporary)

**⚠️ WARNING: Only for testing! Remove before production!**

If you need to test quickly, you can temporarily bypass the admin check:

In `api/requests.php`, comment out the admin check:
```php
// Temporarily bypass for testing
// if (!$isAdminCheck) {
//     sendError('Unauthorized', 403);
//     return;
// }
```

**Remember to remove this before going live!**

## Most Likely Issue

Based on the 302 redirect before 403, **InfinityFree might be redirecting the request** before it reaches your PHP code. This could be:
1. A security feature blocking API calls
2. A redirect to a login page
3. A firewall rule

**Check the 302 redirect:**
- In Network tab, click on the request that shows 302
- Check the "Response Headers" → "Location" header
- This will show where InfinityFree is redirecting to

## Next Steps

1. **Run the diagnostic:** Upload `api/test_auth.php` and test it
2. **Check Network tab:** See what headers are being sent/received
3. **Check error response:** See the actual error message
4. **Contact InfinityFree support:** Ask if they block custom headers or API calls
5. **Consider alternative:** If InfinityFree blocks too much, consider a different host

## Alternative: Use Query Parameter Instead of Header

If headers don't work, we can modify the code to accept userId as a query parameter:

```php
// In api/config.php, getAuthenticatedUserId()
$userId = $_GET['userId'] ?? $headers['X-User-Id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;
```

This way, the API call would be:
```
api/requests.php?userId=admin1
```

But this is less secure as the userId is visible in the URL.

