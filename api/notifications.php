<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Rate limiting
if (!checkRateLimit()) {
    exit(); // Response already sent by checkRateLimit
}

try {
    switch ($method) {
        case 'GET':
            $userId = getAuthenticatedUserId();
            $role = getAuthenticatedUserRole();
            
            if (!$userId) {
                sendError('Unauthorized', 403);
            }
            
            $allNotifications = getAllDocuments('notifications');
            
            if ($role === 'admin') {
                // Admin notifications
                $notifications = array_filter($allNotifications, function($notif) {
                    return ($notif['userId'] ?? null) === 'admin';
                });
                
                // Add pending requests count
                $allRequests = getAllDocuments('requests');
                $pendingCount = 0;
                foreach ($allRequests as $req) {
                    if (strtolower($req['status'] ?? '') === 'pending') {
                        $pendingCount++;
                    }
                }
                
                if ($pendingCount > 0) {
                    array_unshift($notifications, [
                        'id' => 'pending_requests',
                        'type' => 'pending_requests',
                        'data' => json_encode(['count' => $pendingCount]),
                        'read' => false,
                        'timestamp' => date('c')
                    ]);
                }
            } else {
                // Borrower notifications
                $notifications = array_filter($allNotifications, function($notif) use ($userId) {
                    return ($notif['userId'] ?? null) === $userId;
                });
            }
            
            // Sort by timestamp (newest first)
            usort($notifications, function($a, $b) {
                $timeA = $a['timestamp'] ?? '';
                $timeB = $b['timestamp'] ?? '';
                return strcmp($timeB, $timeA);
            });
            
            // Limit to 20
            $notifications = array_slice($notifications, 0, 20);
            
            sendSuccess(array_values($notifications));
            break;
            
        case 'PUT':
        case 'POST':
            $data = getRequestData();
            $action = $data['action'] ?? null;
            $notificationId = $data['id'] ?? null;
            $markAll = $data['markAll'] ?? false;
            
            $userId = getAuthenticatedUserId();
            $role = getAuthenticatedUserRole();
            
            if (!$userId) {
                sendError('Unauthorized', 403);
            }
            
            // Handle POST with action parameter (for InfinityFree compatibility)
            if ($action === 'mark_all_read' || ($method === 'POST' && $markAll)) {
                $allNotifications = getAllDocuments('notifications');
                $count = 0;
                
                // For admin, mark all admin notifications as read
                // For borrowers, mark all their notifications as read
                if ($role === 'admin') {
                    foreach ($allNotifications as $notif) {
                        // Mark admin notifications (userId === 'admin') as read
                        if (($notif['userId'] ?? null) === 'admin' && !($notif['read'] ?? false)) {
                            if (isset($notif['id'])) {
                                updateDocument('notifications', $notif['id'], ['read' => true]);
                                $count++;
                            }
                        }
                    }
                } else {
                    foreach ($allNotifications as $notif) {
                        // Mark borrower's own notifications as read
                        if (($notif['userId'] ?? null) === $userId && !($notif['read'] ?? false)) {
                            if (isset($notif['id'])) {
                                updateDocument('notifications', $notif['id'], ['read' => true]);
                                $count++;
                            }
                        }
                    }
                }
                sendSuccess(['marked' => $count], 'All notifications marked as read');
            } else if ($action === 'mark_read' || ($method === 'POST' && $notificationId) || ($method === 'PUT' && $notificationId)) {
                if (!$notificationId) {
                    sendError('Notification ID is required');
                    return;
                }
                updateDocument('notifications', $notificationId, ['read' => true]);
                sendSuccess(null, 'Notification marked as read');
            } else {
                sendError('Invalid action or missing parameters');
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

