<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }
    
    $borrowerId = $_GET['id'] ?? null;
    $search = $_GET['search'] ?? null;
    $authenticatedUserId = getAuthenticatedUserId();
    
    // If requesting a specific borrower profile
    if ($borrowerId) {
        // Allow if: admin OR borrower viewing their own profile
        if (!isAdmin() && $authenticatedUserId !== $borrowerId) {
            sendError('Unauthorized: You can only view your own profile', 403);
        }
        
        $borrower = getDocument('borrowers', $borrowerId);
        if ($borrower) {
            // Get borrower's requests
            $allRequests = getAllDocuments('requests');
            $borrowerRequests = array_filter($allRequests, function($req) use ($borrowerId) {
                return ($req['borrowerId'] ?? null) === $borrowerId;
            });
            
            $borrower['requests'] = array_values($borrowerRequests);
            sendSuccess($borrower);
        } else {
            sendError('Borrower not found', 404);
        }
    } else {
        // Listing all borrowers requires admin access
        if (!isAdmin()) {
            sendError('Unauthorized: Admin access required', 403);
        }
        $borrowers = getAllDocuments('borrowers');
        $allRequests = getAllDocuments('requests');
        
        // Add request counts
        foreach ($borrowers as &$borrower) {
            $totalRequests = 0;
            foreach ($allRequests as $req) {
                if (($req['borrowerId'] ?? null) === $borrower['id']) {
                    $totalRequests++;
                }
            }
            $borrower['totalRequests'] = $totalRequests;
        }
        
        // Apply search filter
        if ($search) {
            $searchLower = strtolower($search);
            $borrowers = array_filter($borrowers, function($borrower) use ($searchLower) {
                return strpos(strtolower($borrower['id'] ?? ''), $searchLower) !== false ||
                       strpos(strtolower($borrower['name'] ?? ''), $searchLower) !== false ||
                       strpos(strtolower($borrower['email'] ?? ''), $searchLower) !== false ||
                       strpos(strtolower($borrower['course'] ?? ''), $searchLower) !== false;
            });
        }
        
        sendSuccess(array_values($borrowers));
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}


