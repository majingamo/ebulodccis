<?php
/**
 * API Configuration and Helper Functions
 * Handles Firebase operations using REST API
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to api/config.php
 * 2. Replace all placeholder values with your actual credentials
 * 3. Never commit api/config.php to version control
 */

// Enable CORS - Must be first, before any output
// For production, replace * with your actual domain
$allowedOrigins = [
    'http://localhost',
    'http://localhost:8080',
    'http://127.0.0.1',
    'https://yourdomain.com' // Replace with your actual domain
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Check if origin is in allowed list, or if no origin (same-origin request), allow it
if (empty($origin) || in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
} else {
    // For development, allow all origins but log the request
    error_log('CORS: Unauthorized origin: ' . $origin);
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Firebase Configuration
// Get these from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general
define('FIREBASE_PROJECT_ID', 'YOUR_FIREBASE_PROJECT_ID');
define('FIREBASE_API_KEY', 'YOUR_FIREBASE_API_KEY');
define('FIRESTORE_API_BASE', 'https://firestore.googleapis.com/v1/projects/' . FIREBASE_PROJECT_ID . '/databases/(default)/documents');

// Security Configuration
define('RATE_LIMIT_REQUESTS', 100); // Max requests per window
define('RATE_LIMIT_WINDOW', 60); // Time window in seconds
define('RATE_LIMIT_FILE', sys_get_temp_dir() . '/api_rate_limit.json');

// CSRF Protection (using session tokens)
function generateCSRFToken() {
    ensureSession();
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    ensureSession();
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Session Management
function ensureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function getAuthenticatedUserId() {
    ensureSession();
    
    // First, try to get from session (if logged in via PHP)
    $userId = $_SESSION['userId'] ?? null;
    
    // If not in session, try to get from header (for API calls from client)
    if (!$userId) {
        // Get headers - support both getallheaders() and $_SERVER
        $headers = [];
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $headerKey = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                    $headers[$headerKey] = $value;
                }
            }
        }
        // Try multiple header name variations (case-insensitive)
        $userId = null;
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'x-user-id') {
                $userId = $value;
                break;
            }
        }
        // Fallback to $_SERVER direct access
        if (!$userId) {
            $userId = $_SERVER['HTTP_X_USER_ID'] ?? $_SERVER['HTTP_X_USERID'] ?? null;
        }
        // Final fallback
        if (!$userId) {
            $userId = $_GET['userId'] ?? null;
        }
        
        // Trim whitespace
        if ($userId) {
            $userId = trim($userId);
        }
        
        // Validate userId exists in database (but don't fail if validation fails - just log it)
        if ($userId && !empty($userId)) {
            try {
                // Check if it's an admin
                $admin = getDocument('admins', $userId);
                if ($admin) {
                    $_SESSION['userId'] = $userId;
                    $_SESSION['userRole'] = 'admin';
                    return $userId;
                }
                
                // Check if it's a borrower
                $borrower = getDocument('borrowers', $userId);
                if ($borrower) {
                    $_SESSION['userId'] = $userId;
                    $_SESSION['userRole'] = 'borrower';
                    return $userId;
                }
                
                // If userId provided but not found in database, log it but still return it
                // (for cases where database lookup fails due to network issues)
                error_log("Warning: UserId '$userId' not found in database, but allowing request");
                $_SESSION['userId'] = $userId;
                return $userId;
            } catch (Exception $e) {
                // If database lookup fails, still allow the request with the provided userId
                // This prevents authentication failures due to temporary network issues
                error_log("Warning: Could not validate userId '$userId' in database: " . $e->getMessage());
                $_SESSION['userId'] = $userId;
                return $userId;
            }
        }
    }
    
    return $userId;
}

function getAuthenticatedUserRole() {
    ensureSession();
    $role = $_SESSION['userRole'] ?? null;
    
    // If not in session, check based on userId
    if (!$role) {
        $userId = getAuthenticatedUserId();
        if ($userId) {
            $admin = getDocument('admins', $userId);
            if ($admin) return 'admin';
            
            $borrower = getDocument('borrowers', $userId);
            if ($borrower) return 'borrower';
        }
    }
    
    return $role;
}

function isAdmin() {
    $role = getAuthenticatedUserRole();
    // Also check if userId exists and try to determine role from userId itself
    $userId = getAuthenticatedUserId();
    
    if ($role === 'admin') {
        return true;
    }
    
    // If role is not set but userId exists, try to determine from userId
    // This is a fallback for cases where session/role lookup fails
    if ($userId && !$role) {
        try {
            $admin = getDocument('admins', $userId);
            if ($admin) {
                $_SESSION['userRole'] = 'admin';
                return true;
            }
        } catch (Exception $e) {
            error_log("Could not check admin status for userId '$userId': " . $e->getMessage());
        }
    }
    
    return false;
}

// Helper Functions
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendSuccess($data = null, $message = null) {
    $response = ['success' => true];
    if ($message) $response['message'] = $message;
    if ($data !== null) $response['data'] = $data;
    sendResponse($response);
}

function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        return sanitizeInput($data ?? []);
    }
    return sanitizeInput($_POST ?? []);
}

// Input Sanitization
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    if (is_string($data)) {
        // Remove null bytes, trim whitespace
        $data = str_replace("\0", '', $data);
        $data = trim($data);
        // Don't htmlspecialchars here as it breaks JSON data - do it at display time
    }
    return $data;
}

// Enhanced Input Validation
function validateInput($data, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        $ruleArray = is_string($rule) ? explode('|', $rule) : $rule;
        
        foreach ($ruleArray as $r) {
            if ($r === 'required' && (empty($value) && $value !== '0')) {
                $errors[] = "Field '$field' is required";
            } elseif ($r === 'email' && !empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Field '$field' must be a valid email";
            } elseif ($r === 'url' && !empty($value) && !filter_var($value, FILTER_VALIDATE_URL)) {
                $errors[] = "Field '$field' must be a valid URL";
            } elseif (strpos($r, 'min:') === 0 && !empty($value)) {
                $min = (int)substr($r, 4);
                if (strlen($value) < $min) {
                    $errors[] = "Field '$field' must be at least $min characters";
                }
            } elseif (strpos($r, 'max:') === 0 && !empty($value)) {
                $max = (int)substr($r, 4);
                if (strlen($value) > $max) {
                    $errors[] = "Field '$field' must not exceed $max characters";
                }
            } elseif (strpos($r, 'pattern:') === 0 && !empty($value)) {
                $pattern = substr($r, 8);
                if (!preg_match($pattern, $value)) {
                    $errors[] = "Field '$field' has invalid format";
                }
            }
        }
    }
    
    if (!empty($errors)) {
        sendError('Validation failed: ' . implode(', ', $errors), 400);
    }
    
    return true;
}

function sanitizeString($string) {
    $string = trim($string);
    $string = stripslashes($string);
    $string = htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
    return $string;
}

// Rate Limiting (Enhanced)
function checkRateLimit($endpoint = 'default') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userId = getAuthenticatedUserId() ?? 'anonymous';
    $currentTime = time();
    
    // Different limits for different endpoints
    $limits = [
        'login' => ['requests' => 5, 'window' => 300], // 5 requests per 5 minutes
        'default' => ['requests' => RATE_LIMIT_REQUESTS, 'window' => RATE_LIMIT_WINDOW]
    ];
    
    $limit = $limits[$endpoint] ?? $limits['default'];
    
    // Read existing rate limit data
    $rateLimitData = [];
    if (file_exists(RATE_LIMIT_FILE)) {
        $content = @file_get_contents(RATE_LIMIT_FILE);
        if ($content) {
            $rateLimitData = json_decode($content, true) ?? [];
        }
    }
    
    // Clean old entries
    foreach ($rateLimitData as $key => $data) {
        if ($currentTime - $data['first_request'] > $limit['window']) {
            unset($rateLimitData[$key]);
        }
    }
    
    // Create unique key for IP + UserId + Endpoint
    $key = $ip . '_' . $userId . '_' . $endpoint;
    
    // Check current key
    if (!isset($rateLimitData[$key])) {
        $rateLimitData[$key] = [
            'first_request' => $currentTime,
            'request_count' => 1,
            'ip' => $ip,
            'userId' => $userId,
            'endpoint' => $endpoint
        ];
    } else {
        $rateLimitData[$key]['request_count']++;
        
        // Check if limit exceeded
        if ($rateLimitData[$key]['request_count'] > $limit['requests']) {
            $remainingTime = $limit['window'] - ($currentTime - $rateLimitData[$key]['first_request']);
            http_response_code(429);
            sendError('Rate limit exceeded. Please try again in ' . ceil($remainingTime / 60) . ' minute(s).', 429);
            return false;
        }
    }
    
    // Save rate limit data
    @file_put_contents(RATE_LIMIT_FILE, json_encode($rateLimitData));
    return true;
}

// Activity Logging
function logActivity($action, $details = [], $userId = null, $userRole = null) {
    try {
        $userId = $userId ?? getAuthenticatedUserId();
        $userRole = $userRole ?? getAuthenticatedUserRole();
        
        $logData = [
            'action' => $action,
            'userId' => $userId,
            'userRole' => $userRole,
            'details' => json_encode($details),
            'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => date('c')
        ];
        
        createDocument('activity_logs', $logData);
    } catch (Exception $e) {
        // Don't fail the request if logging fails
        error_log('Failed to log activity: ' . $e->getMessage());
    }
}

function validateRequired($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing));
    }
}

// Firebase REST API Functions
function firestoreRequest($method, $path, $data = null) {
    // Handle URL construction - if path already has query params, use & instead of ?
    $separator = strpos($path, '?') !== false ? '&' : '?';
    $url = FIRESTORE_API_BASE . $path . $separator . 'key=' . FIREBASE_API_KEY;
    
    // Try cURL first (preferred method)
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        
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
            // Fall through to file_get_contents if cURL fails
        } else if ($httpCode >= 400) {
            error_log('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
            error_log('URL: ' . $url);
            if ($data !== null) {
                error_log('Request data: ' . json_encode($data));
            }
            throw new Exception('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
        } else {
            return json_decode($response, true);
        }
    }
    
    // Fallback to file_get_contents() if cURL is not available or failed
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
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            $error = error_get_last();
            throw new Exception('Failed to connect to Firebase API: ' . ($error['message'] ?? 'Unknown error'));
        }
        
        // Get HTTP response code from headers
        if (isset($http_response_header) && !empty($http_response_header)) {
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $matches);
            $httpCode = isset($matches[1]) ? (int)$matches[1] : 200;
        } else {
            $httpCode = 200; // Assume success if no headers
        }
        
        if ($httpCode >= 400) {
            error_log('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
            error_log('URL: ' . $url);
            throw new Exception('Firestore API error (HTTP ' . $httpCode . '): ' . $response);
        }
        
        return json_decode($response, true);
    }
    
    // If both methods fail
    throw new Exception('Neither cURL nor allow_url_fopen is available. Please enable one of them on your hosting.');
}

function convertToFirestoreFormat($data) {
    $fields = [];
    foreach ($data as $key => $value) {
        if ($value === null) {
            $fields[$key] = ['nullValue' => null];
        } elseif (is_bool($value)) {
            $fields[$key] = ['booleanValue' => $value];
        } elseif (is_int($value)) {
            $fields[$key] = ['integerValue' => (string)$value];
        } elseif ($value instanceof DateTime) {
            $fields[$key] = ['timestampValue' => $value->format('c')];
        } else {
            $fields[$key] = ['stringValue' => (string)$value];
        }
    }
    return $fields;
}

function convertFromFirestoreFormat($firestoreDoc) {
    if (!isset($firestoreDoc['fields'])) {
        return [];
    }
    
    $data = [];
    foreach ($firestoreDoc['fields'] as $key => $field) {
        if (isset($field['stringValue'])) {
            $data[$key] = $field['stringValue'];
        } elseif (isset($field['integerValue'])) {
            $data[$key] = (int)$field['integerValue'];
        } elseif (isset($field['booleanValue'])) {
            $data[$key] = $field['booleanValue'];
        } elseif (isset($field['timestampValue'])) {
            $data[$key] = $field['timestampValue'];
        } elseif (isset($field['nullValue'])) {
            $data[$key] = null;
        }
    }
    
    return $data;
}

// Collection Helper Functions
function getAllDocuments($collection) {
    $path = '/' . $collection;
    try {
        $response = firestoreRequest('GET', $path);
        $documents = [];
        
        if (isset($response['documents'])) {
            foreach ($response['documents'] as $doc) {
                $docId = basename($doc['name']);
                $data = convertFromFirestoreFormat($doc);
                $data['id'] = $docId;
                $documents[] = $data;
            }
        }
        
        return $documents;
    } catch (Exception $e) {
        return [];
    }
}

function getDocument($collection, $docId) {
    $path = '/' . $collection . '/' . $docId;
    try {
        $response = firestoreRequest('GET', $path);
        $data = convertFromFirestoreFormat($response);
        $data['id'] = $docId;
        return $data;
    } catch (Exception $e) {
        return null;
    }
}

function createDocument($collection, $data) {
    $path = '/' . $collection;
    $firestoreData = convertToFirestoreFormat($data);
    
    try {
        // POST to collection path - Firestore will generate the document ID
        $response = firestoreRequest('POST', $path, ['fields' => $firestoreData]);
        
        // Extract document ID from response
        if (isset($response['name'])) {
            $parts = explode('/', $response['name']);
            return end($parts);
        }
        
        // Fallback: generate ID if not in response
        return uniqid();
    } catch (Exception $e) {
        error_log('Firestore createDocument error: ' . $e->getMessage());
        throw new Exception('Failed to create document: ' . $e->getMessage());
    }
}

function updateDocument($collection, $docId, $data) {
    if (empty($data)) {
        throw new Exception('Update data cannot be empty');
    }
    
    $path = '/' . $collection . '/' . $docId;
    
    // Filter out null values before converting (Firestore handles nulls, but we'll include them)
    // Convert to Firestore format
    $firestoreData = convertToFirestoreFormat($data);
    
    // Get update mask (list of fields to update)
    // URL encode field paths to handle special characters
    $fieldPaths = array_map('urlencode', array_keys($data));
    $updateMask = 'updateMask.fieldPaths=' . implode('&updateMask.fieldPaths=', $fieldPaths);
    
    try {
        // Build URL with update mask, then firestoreRequest will add API key
        $pathWithMask = $path . '?' . $updateMask;
        firestoreRequest('PATCH', $pathWithMask, ['fields' => $firestoreData]);
        return true;
    } catch (Exception $e) {
        error_log('Firestore updateDocument error: ' . $e->getMessage());
        error_log('Collection: ' . $collection);
        error_log('Document ID: ' . $docId);
        error_log('Path: ' . $path);
        error_log('Update mask: ' . $updateMask);
        error_log('Data: ' . json_encode($data));
        error_log('Firestore data: ' . json_encode($firestoreData));
        throw $e;
    }
}

function deleteDocument($collection, $docId) {
    $path = '/' . $collection . '/' . $docId;
    try {
        firestoreRequest('DELETE', $path);
        return true;
    } catch (Exception $e) {
        throw $e;
    }
}

function queryDocuments($collection, $filters = []) {
    // For complex queries, we'll fetch all and filter in PHP
    // This is simpler but less efficient - can be optimized later
    $allDocs = getAllDocuments($collection);
    
    foreach ($filters as $filter) {
        $field = $filter['field'];
        $operator = $filter['operator'];
        $value = $filter['value'];
        
        $allDocs = array_filter($allDocs, function($doc) use ($field, $operator, $value) {
            $docValue = $doc[$field] ?? null;
            
            switch ($operator) {
                case '==':
                    return $docValue === $value;
                case '!=':
                    return $docValue !== $value;
                case '>':
                    return $docValue > $value;
                case '<':
                    return $docValue < $value;
                case '>=':
                    return $docValue >= $value;
                case '<=':
                    return $docValue <= $value;
                default:
                    return true;
            }
        });
    }
    
    return array_values($allDocs);
}


