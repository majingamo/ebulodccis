# Free Hosting Issues & Solutions (InfinityFree)

## ⚠️ CRITICAL: InfinityFree Blocks PUT/DELETE Methods

**InfinityFree FREE plans block PUT and DELETE HTTP methods!**

If you see errors like:
- `redirected from 'http://yoursite.com/api/requests.php' to 'https://errors.infinityfree.net/errors/403/'`
- CORS errors when trying to approve/reject/update/delete
- 302 redirects followed by 403 errors

**Solution:** Use POST with an `action` parameter instead:
- ✅ `POST /api/requests.php` with `{ action: 'approve' }`
- ❌ `PUT /api/requests.php` (BLOCKED by InfinityFree)

**This has been fixed in the code!** All PUT/DELETE requests now use POST with action parameters.

See `docs/INFINITYFREE_TROUBLESHOOTING.md` for details.

---

## Common Issues with Free Hosting

Free hosting services like InfinityFree have limitations that can break our PHP backend:

### 1. **cURL Restrictions**
- **Problem:** Free hosts often disable or restrict cURL
- **Impact:** Cannot make HTTP requests to Firebase REST API
- **Symptoms:** Functions like approve/reject requests fail silently

### 2. **External API Calls Blocked**
- **Problem:** Free hosts may block external HTTP requests
- **Impact:** Cannot communicate with Firebase Firestore API
- **Symptoms:** All database operations fail

### 3. **PHP Version Limitations**
- **Problem:** Older PHP versions may not support all features
- **Impact:** Some code may not work
- **Symptoms:** Syntax errors or missing functions

### 4. **Execution Time Limits**
- **Problem:** Very short execution time limits (often 30 seconds)
- **Impact:** Long-running operations timeout
- **Symptoms:** Requests fail after timeout

### 5. **Memory Limits**
- **Problem:** Very low memory limits (often 128MB)
- **Impact:** Large operations may fail
- **Symptoms:** Out of memory errors

### 6. **HTTPS/SSL Issues**
- **Problem:** Free SSL certificates may have issues
- **Impact:** Mixed content errors, API calls fail
- **Symptoms:** CORS errors, API failures

---

## Diagnostic Steps

### Step 1: Check PHP Configuration

Create a file called `check_php.php` and upload it to your hosting:

```php
<?php
echo "PHP Version: " . phpversion() . "<br>";
echo "cURL Enabled: " . (function_exists('curl_init') ? 'Yes' : 'No') . "<br>";
echo "Memory Limit: " . ini_get('memory_limit') . "<br>";
echo "Max Execution Time: " . ini_get('max_execution_time') . "<br>";
echo "Allow URL Fopen: " . (ini_get('allow_url_fopen') ? 'Yes' : 'No') . "<br>";

// Test cURL
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://www.google.com');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "cURL Error: " . $error . "<br>";
    } else {
        echo "cURL Test: Success (can make external requests)<br>";
    }
} else {
    echo "cURL is NOT available!<br>";
}
?>
```

**Access this file:** `https://yourdomain.com/check_php.php`

### Step 2: Test Firebase API Connection

Create a file called `test_firebase.php`:

```php
<?php
require_once 'api/config.php';

header('Content-Type: text/plain');

try {
    // Test getting a document
    $testDoc = getDocument('equipments', 'test123');
    echo "Firebase connection: OK\n";
    echo "Test document result: " . (is_null($testDoc) ? "Not found (expected)" : "Found") . "\n";
} catch (Exception $e) {
    echo "Firebase connection: FAILED\n";
    echo "Error: " . $e->getMessage() . "\n";
}

// Test cURL with Firebase
$url = 'https://firestore.googleapis.com/v1/projects/studio-5277928304-db252/databases/(default)/documents/equipments?key=AIzaSyB-I8YDtDaGJ--uIw5ppePzxutvdnHYCYg';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "\nFirebase API Test:\n";
echo "HTTP Code: " . $httpCode . "\n";
if ($error) {
    echo "Error: " . $error . "\n";
} else {
    echo "Response length: " . strlen($response) . " bytes\n";
    if ($httpCode === 200) {
        echo "Status: SUCCESS\n";
    } else {
        echo "Status: FAILED\n";
        echo "Response: " . substr($response, 0, 500) . "\n";
    }
}
?>
```

**Access this file:** `https://yourdomain.com/test_firebase.php`

### Step 3: Check Error Logs

InfinityFree usually provides error logs in the control panel. Check for:
- cURL errors
- HTTP timeout errors
- Memory limit errors
- Permission errors

---

## Solutions

### Solution 1: Enable Error Reporting (Temporary)

Add this to the top of your `api/config.php`:

```php
<?php
// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

require_once __DIR__ . '/config.php';
```

### Solution 2: Use file_get_contents() as Fallback

If cURL is disabled, we can use `file_get_contents()` as a fallback. Update `api/config.php`:

```php
function firestoreRequest($method, $path, $data = null) {
    // Handle URL construction
    $separator = strpos($path, '?') !== false ? '&' : '?';
    $url = FIRESTORE_API_BASE . $path . $separator . 'key=' . FIREBASE_API_KEY;
    
    // Try cURL first
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        if ($data !== null) {
            $jsonData = json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            error_log('cURL error: ' . $curlError);
            throw new Exception('Network error: ' . $curlError);
        }
        
        if ($httpCode >= 400) {
            error_log('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
            throw new Exception('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
        }
        
        return json_decode($response, true);
    }
    
    // Fallback to file_get_contents() if cURL is not available
    if (ini_get('allow_url_fopen')) {
        $contextOptions = [
            'http' => [
                'method' => $method,
                'header' => 'Content-Type: application/json',
                'timeout' => 30,
                'ignore_errors' => true
            ]
        ];
        
        if ($data !== null) {
            $contextOptions['http']['content'] = json_encode($data);
        }
        
        $context = stream_context_create($contextOptions);
        $response = file_get_contents($url, false, $context);
        
        if ($response === false) {
            throw new Exception('Failed to connect to Firebase API');
        }
        
        // Get HTTP response code
        preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $matches);
        $httpCode = isset($matches[1]) ? (int)$matches[1] : 200;
        
        if ($httpCode >= 400) {
            error_log('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
            throw new Exception('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
        }
        
        return json_decode($response, true);
    }
    
    throw new Exception('Neither cURL nor allow_url_fopen is available. Please enable one of them.');
}
```

### Solution 3: Check InfinityFree Specific Settings

1. **Enable cURL in InfinityFree:**
   - Go to InfinityFree Control Panel
   - Look for "PHP Settings" or "PHP Configuration"
   - Enable cURL extension
   - Some free hosts don't allow this - check their documentation

2. **Check Firewall Settings:**
   - InfinityFree may block external API calls
   - Check if there's a whitelist for external domains
   - Contact support if Firebase API calls are blocked

3. **Use HTTPS:**
   - Make sure your site uses HTTPS
   - Firebase API requires HTTPS for security
   - InfinityFree provides free SSL

### Solution 4: Use Firebase Admin SDK (Alternative)

If REST API doesn't work, we can use Firebase Admin SDK with a service account:

**Note:** This requires Composer and may not work on free hosting due to dependencies.

### Solution 5: Check API Response in Browser

Open browser Developer Tools (F12) → Network tab:
1. Try to approve a request
2. Look for the API call to `api/requests.php`
3. Check the response - it will show the actual error

---

## Common Error Messages

### "cURL error: Could not resolve host"
- **Cause:** DNS resolution failed or external requests blocked
- **Solution:** Check if external API calls are allowed

### "Firestore API error (HTTP 403)"
- **Cause:** API key invalid or permissions issue
- **Solution:** Check Firebase API key and permissions

### "Firestore API error (HTTP 404)"
- **Cause:** Wrong URL or project ID
- **Solution:** Verify Firebase project ID and API endpoints

### "Maximum execution time exceeded"
- **Cause:** Operation takes too long
- **Solution:** Optimize code or increase timeout (if possible)

### "Out of memory"
- **Cause:** Too much data processed
- **Solution:** Process data in smaller chunks

---

## Recommended Actions

### Immediate Steps:

1. **Create diagnostic files** (check_php.php, test_firebase.php)
2. **Check InfinityFree control panel** for PHP settings
3. **Enable error logging** in api/config.php
4. **Test API connection** using test_firebase.php
5. **Check browser console** for JavaScript errors
6. **Check network tab** for API response errors

### If cURL is Disabled:

1. **Contact InfinityFree support** to enable cURL
2. **Use file_get_contents() fallback** (Solution 2)
3. **Consider upgrading** to a paid plan that supports cURL

### If External API Calls are Blocked:

1. **Contact InfinityFree support** to whitelist Firebase API
2. **Consider alternative hosting** that allows external API calls
3. **Use a different approach** (like Firebase Admin SDK with service account)

---

## Alternative Hosting Options

If InfinityFree doesn't work, consider:

1. **000webhost** - Another free host (may have same issues)
2. **GitHub Pages** - Free but only for static sites (won't work for PHP)
3. **Vercel/Netlify** - Free but need to adapt for serverless
4. **Paid hosting** - $3-5/month gets you reliable hosting with cURL enabled

---

## Testing Checklist

- [ ] PHP version is 7.4 or higher
- [ ] cURL is enabled
- [ ] allow_url_fopen is enabled
- [ ] Can make external HTTP requests
- [ ] Firebase API is accessible
- [ ] Error logging is working
- [ ] SSL/HTTPS is configured
- [ ] No firewall blocking external API calls

---

## Next Steps

1. Upload diagnostic files to your hosting
2. Run the tests and note the results
3. Check error logs in InfinityFree control panel
4. Share the results to get specific help
5. Implement the appropriate solution based on results

