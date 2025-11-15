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
            $requestId = $_GET['id'] ?? null;
            $borrowerId = $_GET['borrowerId'] ?? null;
            $status = $_GET['status'] ?? null;
            
            if ($requestId) {
                $request = getDocument('requests', $requestId);
                if ($request) {
                    sendSuccess($request);
                } else {
                    sendError('Request not found', 404);
                }
            } else {
                $allRequests = getAllDocuments('requests');
                
                // Apply filters
                if ($borrowerId) {
                    $allRequests = array_filter($allRequests, function($req) use ($borrowerId) {
                        return ($req['borrowerId'] ?? null) === $borrowerId;
                    });
                }
                if ($status) {
                    $allRequests = array_filter($allRequests, function($req) use ($status) {
                        return strtolower($req['status'] ?? '') === strtolower($status);
                    });
                }
                
                sendSuccess(array_values($allRequests));
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            // Check if this is an update action (approve, reject, return, cancel) or a new request
            if (isset($data['action'])) {
                // This is an update action (using POST instead of PUT for InfinityFree compatibility)
                $requestId = $data['id'] ?? null;
                $action = $data['action'];
                
                if (!$requestId) {
                    sendError('Request ID is required', 400);
                    return;
                }
                
                $request = getDocument('requests', $requestId);
                
                if (!$request) {
                    sendError('Request not found', 404);
                    return;
                }
                
                $updateData = [];
                
                switch ($action) {
                    case 'approve':
                        // Check authentication with better error message
                        $userId = getAuthenticatedUserId();
                        $isAdminCheck = isAdmin();
                        
                        if (!$userId) {
                            sendError('Authentication required. Please log in again.', 401);
                            return;
                        }
                        
                        if (!$isAdminCheck) {
                            $role = getAuthenticatedUserRole();
                            error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                            
                            // Try one more time with direct database check
                            if ($userId) {
                                try {
                                    $admin = getDocument('admins', $userId);
                                    if ($admin) {
                                        $_SESSION['userRole'] = 'admin';
                                        $isAdminCheck = true;
                                    }
                                } catch (Exception $e) {
                                    error_log("Final admin check failed: " . $e->getMessage());
                                }
                            }
                            
                            if (!$isAdminCheck) {
                                sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                                return;
                            }
                        }
                        
                        $updateData = [
                            'status' => 'approved',
                            'approvedAt' => date('c'),
                            'approvedBy' => getAuthenticatedUserId()
                        ];
                        
                        // Only include adminComment if it's provided and not empty
                        if (!empty($data['adminComment'])) {
                            $updateData['adminComment'] = $data['adminComment'];
                        }
                        
                        // Update equipment status
                        updateDocument('equipments', $request['equipmentId'], [
                            'status' => 'Borrowed',
                            'currentBorrowerId' => $request['borrowerId'],
                            'borrowedAt' => date('c')
                        ]);
                        
                        // Create history entry
                        createDocument('equipmentHistory', [
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'borrowerId' => $request['borrowerId'],
                            'requestId' => $requestId,
                            'action' => 'borrowed',
                            'timestamp' => date('c'),
                            'expectedReturnDate' => $request['returnDate'] ?? null
                        ]);
                        
                        // Create notification
                        createDocument('notifications', [
                            'userId' => $request['borrowerId'],
                            'type' => 'request_approved',
                            'data' => json_encode([
                                'equipmentName' => $request['equipmentName'],
                                'requestId' => $requestId
                            ]),
                            'read' => false,
                            'timestamp' => date('c')
                        ]);
                        
                        // Log activity
                        logActivity('approve_request', [
                            'requestId' => $requestId,
                            'borrowerId' => $request['borrowerId'],
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName']
                        ]);
                        break;
                        
                    case 'reject':
                        // Check authentication with better error message
                        $userId = getAuthenticatedUserId();
                        $isAdminCheck = isAdmin();
                        
                        if (!$userId) {
                            sendError('Authentication required. Please log in again.', 401);
                            return;
                        }
                        
                        if (!$isAdminCheck) {
                            $role = getAuthenticatedUserRole();
                            error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                            
                            // Try one more time with direct database check
                            if ($userId) {
                                try {
                                    $admin = getDocument('admins', $userId);
                                    if ($admin) {
                                        $_SESSION['userRole'] = 'admin';
                                        $isAdminCheck = true;
                                    }
                                } catch (Exception $e) {
                                    error_log("Final admin check failed: " . $e->getMessage());
                                }
                            }
                            
                            if (!$isAdminCheck) {
                                sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                                return;
                            }
                        }
                        
                        $updateData = [
                            'status' => 'rejected',
                            'rejectedAt' => date('c'),
                            'rejectedBy' => getAuthenticatedUserId()
                        ];
                        
                        // Only include adminComment if it's provided and not empty
                        if (!empty($data['adminComment'])) {
                            $updateData['adminComment'] = $data['adminComment'];
                        }
                        
                        // Create notification
                        createDocument('notifications', [
                            'userId' => $request['borrowerId'],
                            'type' => 'request_rejected',
                            'data' => json_encode([
                                'equipmentName' => $request['equipmentName'],
                                'requestId' => $requestId
                            ]),
                            'read' => false,
                            'timestamp' => date('c')
                        ]);
                        
                        // Log activity
                        logActivity('reject_request', [
                            'requestId' => $requestId,
                            'borrowerId' => $request['borrowerId'],
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'adminComment' => $updateData['adminComment'] ?? ''
                        ]);
                        break;
                        
                    case 'return':
                        // Check authentication with better error message
                        $userId = getAuthenticatedUserId();
                        $isAdminCheck = isAdmin();
                        
                        if (!$userId) {
                            sendError('Authentication required. Please log in again.', 401);
                            return;
                        }
                        
                        if (!$isAdminCheck) {
                            $role = getAuthenticatedUserRole();
                            error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                            
                            // Try one more time with direct database check
                            if ($userId) {
                                try {
                                    $admin = getDocument('admins', $userId);
                                    if ($admin) {
                                        $_SESSION['userRole'] = 'admin';
                                        $isAdminCheck = true;
                                    }
                                } catch (Exception $e) {
                                    error_log("Final admin check failed: " . $e->getMessage());
                                }
                            }
                            
                            if (!$isAdminCheck) {
                                sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                                return;
                            }
                        }
                        
                        validateRequired($data, ['returnCondition']);
                        
                        $updateData = [
                            'status' => 'returned',
                            'returnedAt' => date('c'),
                            'returnedBy' => getAuthenticatedUserId(),
                            'returnCondition' => $data['returnCondition']
                        ];
                        
                        // Only include returnNotes if provided
                        if (!empty($data['returnNotes'])) {
                            $updateData['returnNotes'] = $data['returnNotes'];
                        }
                        
                        // Update equipment
                        $equipmentUpdate = [
                            'status' => 'Available'
                        ];
                        
                        // Set currentBorrowerId and borrowedAt to null (delete fields)
                        $equipmentUpdate['currentBorrowerId'] = null;
                        $equipmentUpdate['borrowedAt'] = null;
                        
                        if ($data['returnCondition'] === 'Damaged') {
                            $equipmentUpdate['condition'] = 'Damaged';
                        }
                        
                        updateDocument('equipments', $request['equipmentId'], $equipmentUpdate);
                        
                        // Create history entry
                        createDocument('equipmentHistory', [
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'borrowerId' => $request['borrowerId'],
                            'requestId' => $requestId,
                            'action' => 'returned',
                            'condition' => $data['returnCondition'],
                            'notes' => $data['returnNotes'] ?? null,
                            'timestamp' => date('c')
                        ]);
                        
                        // Create notification
                        createDocument('notifications', [
                            'userId' => $request['borrowerId'],
                            'type' => 'equipment_returned',
                            'data' => json_encode([
                                'equipmentName' => $request['equipmentName'],
                                'requestId' => $requestId
                            ]),
                            'read' => false,
                            'timestamp' => date('c')
                        ]);
                        
                        // Log activity
                        logActivity('return_equipment', [
                            'requestId' => $requestId,
                            'borrowerId' => $request['borrowerId'],
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'returnCondition' => $data['returnCondition'],
                            'returnNotes' => $data['returnNotes'] ?? ''
                        ]);
                        break;
                        
                    case 'cancel':
                        validateRequired($data, ['cancellationComment']);
                        
                        if ($request['status'] !== 'pending') {
                            sendError('Can only cancel pending requests', 400);
                            return;
                        }
                        
                        $updateData = [
                            'status' => 'cancelled',
                            'cancelledAt' => date('c'),
                            'cancelledBy' => getRequestData()['borrowerId'] ?? getAuthenticatedUserId(),
                            'cancellationComment' => $data['cancellationComment']
                        ];
                        
                        // Create notification for admin
                        createDocument('notifications', [
                            'userId' => 'admin',
                            'type' => 'request_cancelled',
                            'data' => json_encode([
                                'borrowerId' => $request['borrowerId'],
                                'equipmentName' => $request['equipmentName'],
                                'requestId' => $requestId,
                                'cancellationComment' => $data['cancellationComment']
                            ]),
                            'read' => false,
                            'timestamp' => date('c')
                        ]);
                        
                        // Log activity
                        logActivity('cancel_request', [
                            'requestId' => $requestId,
                            'borrowerId' => $request['borrowerId'],
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'cancellationComment' => $data['cancellationComment']
                        ]);
                        break;
                        
                    case 'review':
                        // Allow borrowers to review returned equipment
                        $userId = getAuthenticatedUserId();
                        if (!$userId || $userId !== $request['borrowerId']) {
                            sendError('Unauthorized: You can only review your own requests', 403);
                            return;
                        }
                        
                        if ($request['status'] !== 'returned') {
                            sendError('Can only review returned equipment', 400);
                            return;
                        }
                        
                        if (!isset($data['review']) || !isset($data['review']['rating'])) {
                            sendError('Review data with rating is required', 400);
                            return;
                        }
                        
                        $reviewData = $data['review'];
                        if (!is_numeric($reviewData['rating']) || $reviewData['rating'] < 1 || $reviewData['rating'] > 5) {
                            sendError('Rating must be between 1 and 5', 400);
                            return;
                        }
                        
                        $updateData = [
                            'reviewed' => true,
                            'review' => [
                                'rating' => (int)$reviewData['rating'],
                                'comment' => $reviewData['comment'] ?? null,
                                'timestamp' => $reviewData['timestamp'] ?? date('c'),
                                'equipmentId' => $reviewData['equipmentId'] ?? $request['equipmentId']
                            ]
                        ];
                        
                        // Log activity
                        logActivity('submit_review', [
                            'requestId' => $requestId,
                            'borrowerId' => $request['borrowerId'],
                            'equipmentId' => $request['equipmentId'],
                            'equipmentName' => $request['equipmentName'],
                            'rating' => $reviewData['rating']
                        ]);
                        break;
                        
                    default:
                        sendError('Invalid action', 400);
                        return;
                }
                
                if (empty($updateData)) {
                    sendError('No update data provided', 400);
                    return;
                }
                
                // Update the request document
                updateDocument('requests', $requestId, $updateData);
                
                // Note: Activity logging is done within each action case before break
                
                sendSuccess(null, 'Request updated successfully');
                return;
            }
            
            // This is a new request creation
            validateRequired($data, ['borrowerId', 'equipmentId', 'equipmentName', 'purpose']);
            
            $requestData = [
                'borrowerId' => $data['borrowerId'],
                'equipmentId' => $data['equipmentId'],
                'equipmentName' => $data['equipmentName'],
                'purpose' => $data['purpose'],
                'requestDate' => $data['requestDate'] ?? null,
                'returnDate' => $data['returnDate'] ?? null,
                'startTime' => $data['startTime'] ?? null,
                'endTime' => $data['endTime'] ?? null,
                'status' => 'pending',
                'timestamp' => date('c')
            ];
            
            $requestData = array_filter($requestData, function($value) {
                return $value !== null;
            });
            
            $docId = createDocument('requests', $requestData);
            
            // Log activity
            logActivity('create_request', [
                'requestId' => $docId,
                'borrowerId' => $requestData['borrowerId'],
                'equipmentId' => $requestData['equipmentId'],
                'equipmentName' => $requestData['equipmentName'],
                'purpose' => $requestData['purpose']
            ]);
            
            sendSuccess(['id' => $docId], 'Request created successfully');
            break;
            
        case 'PUT':
            // Legacy support - redirect to POST with action
            $data = getRequestData();
            validateRequired($data, ['id', 'action']);
            
            $requestId = $data['id'];
            $action = $data['action'];
            $request = getDocument('requests', $requestId);
            
            if (!$request) {
                sendError('Request not found', 404);
                return;
            }
            
            $updateData = [];
            
            switch ($action) {
                case 'approve':
                    // Check authentication with better error message
                    $userId = getAuthenticatedUserId();
                    $isAdminCheck = isAdmin();
                    
                    if (!$userId) {
                        sendError('Authentication required. Please log in again.', 401);
                        return;
                    }
                    
                    if (!$isAdminCheck) {
                        $role = getAuthenticatedUserRole();
                        error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                        
                        // Try one more time with direct database check
                        if ($userId) {
                            try {
                                $admin = getDocument('admins', $userId);
                                if ($admin) {
                                    $_SESSION['userRole'] = 'admin';
                                    $isAdminCheck = true;
                                }
                            } catch (Exception $e) {
                                error_log("Final admin check failed: " . $e->getMessage());
                            }
                        }
                        
                        if (!$isAdminCheck) {
                            sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                            return;
                        }
                    }
                    
                    $updateData = [
                        'status' => 'approved',
                        'approvedAt' => date('c'),
                        'approvedBy' => getAuthenticatedUserId()
                    ];
                    
                    // Only include adminComment if it's provided and not empty
                    if (!empty($data['adminComment'])) {
                        $updateData['adminComment'] = $data['adminComment'];
                    }
                    
                    // Update equipment status
                    updateDocument('equipments', $request['equipmentId'], [
                        'status' => 'Borrowed',
                        'currentBorrowerId' => $request['borrowerId'],
                        'borrowedAt' => date('c')
                    ]);
                    
                    // Create history entry
                    createDocument('equipmentHistory', [
                        'equipmentId' => $request['equipmentId'],
                        'equipmentName' => $request['equipmentName'],
                        'borrowerId' => $request['borrowerId'],
                        'requestId' => $requestId,
                        'action' => 'borrowed',
                        'timestamp' => date('c'),
                        'expectedReturnDate' => $request['returnDate'] ?? null
                    ]);
                    
                    // Create notification
                    createDocument('notifications', [
                        'userId' => $request['borrowerId'],
                        'type' => 'request_approved',
                        'data' => json_encode([
                            'equipmentName' => $request['equipmentName'],
                            'requestId' => $requestId
                        ]),
                        'read' => false,
                        'timestamp' => date('c')
                    ]);
                    break;
                    
                case 'reject':
                    // Check authentication with better error message
                    $userId = getAuthenticatedUserId();
                    $isAdminCheck = isAdmin();
                    
                    if (!$userId) {
                        sendError('Authentication required. Please log in again.', 401);
                        return;
                    }
                    
                    if (!$isAdminCheck) {
                        $role = getAuthenticatedUserRole();
                        error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                        
                        // Try one more time with direct database check
                        if ($userId) {
                            try {
                                $admin = getDocument('admins', $userId);
                                if ($admin) {
                                    $_SESSION['userRole'] = 'admin';
                                    $isAdminCheck = true;
                                }
                            } catch (Exception $e) {
                                error_log("Final admin check failed: " . $e->getMessage());
                            }
                        }
                        
                        if (!$isAdminCheck) {
                            sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                            return;
                        }
                    }
                    
                    $updateData = [
                        'status' => 'rejected',
                        'rejectedAt' => date('c'),
                        'rejectedBy' => getAuthenticatedUserId()
                    ];
                    
                    // Only include adminComment if it's provided and not empty
                    if (!empty($data['adminComment'])) {
                        $updateData['adminComment'] = $data['adminComment'];
                    }
                    
                    // Create notification
                    createDocument('notifications', [
                        'userId' => $request['borrowerId'],
                        'type' => 'request_rejected',
                        'data' => json_encode([
                            'equipmentName' => $request['equipmentName'],
                            'requestId' => $requestId
                        ]),
                        'read' => false,
                        'timestamp' => date('c')
                    ]);
                    break;
                    
                case 'return':
                    // Check authentication with better error message
                    $userId = getAuthenticatedUserId();
                    $isAdminCheck = isAdmin();
                    
                    if (!$userId) {
                        sendError('Authentication required. Please log in again.', 401);
                        return;
                    }
                    
                    if (!$isAdminCheck) {
                        $role = getAuthenticatedUserRole();
                        error_log("Admin check failed - userId: " . ($userId ?? 'null') . ", role: " . ($role ?? 'null'));
                        
                        // Try one more time with direct database check
                        if ($userId) {
                            try {
                                $admin = getDocument('admins', $userId);
                                if ($admin) {
                                    $_SESSION['userRole'] = 'admin';
                                    $isAdminCheck = true;
                                }
                            } catch (Exception $e) {
                                error_log("Final admin check failed: " . $e->getMessage());
                            }
                        }
                        
                        if (!$isAdminCheck) {
                            sendError('Unauthorized: Admin access required. User ID: ' . ($userId ?? 'not provided') . ', Role: ' . ($role ?? 'not set'), 403);
                            return;
                        }
                    }
                    
                    validateRequired($data, ['returnCondition']);
                    
                    $updateData = [
                        'status' => 'returned',
                        'returnedAt' => date('c'),
                        'returnedBy' => getAuthenticatedUserId(),
                        'returnCondition' => $data['returnCondition']
                    ];
                    
                    // Only include returnNotes if provided
                    if (!empty($data['returnNotes'])) {
                        $updateData['returnNotes'] = $data['returnNotes'];
                    }
                    
                    // Update equipment
                    $equipmentUpdate = [
                        'status' => 'Available'
                    ];
                    
                    // Set currentBorrowerId and borrowedAt to null (delete fields)
                    $equipmentUpdate['currentBorrowerId'] = null;
                    $equipmentUpdate['borrowedAt'] = null;
                    
                    if ($data['returnCondition'] === 'Damaged') {
                        $equipmentUpdate['condition'] = 'Damaged';
                    }
                    
                    updateDocument('equipments', $request['equipmentId'], $equipmentUpdate);
                    
                    // Create history entry
                    createDocument('equipmentHistory', [
                        'equipmentId' => $request['equipmentId'],
                        'equipmentName' => $request['equipmentName'],
                        'borrowerId' => $request['borrowerId'],
                        'requestId' => $requestId,
                        'action' => 'returned',
                        'condition' => $data['returnCondition'],
                        'notes' => $data['returnNotes'] ?? null,
                        'timestamp' => date('c')
                    ]);
                    
                    // Create notification
                    createDocument('notifications', [
                        'userId' => $request['borrowerId'],
                        'type' => 'equipment_returned',
                        'data' => json_encode([
                            'equipmentName' => $request['equipmentName'],
                            'requestId' => $requestId
                        ]),
                        'read' => false,
                        'timestamp' => date('c')
                    ]);
                    break;
                    
                case 'cancel':
                    validateRequired($data, ['cancellationComment']);
                    
                    if ($request['status'] !== 'pending') {
                        sendError('Can only cancel pending requests', 400);
                        return;
                    }
                    
                    $updateData = [
                        'status' => 'cancelled',
                        'cancelledAt' => date('c'),
                        'cancelledBy' => getRequestData()['borrowerId'] ?? getAuthenticatedUserId(),
                        'cancellationComment' => $data['cancellationComment']
                    ];
                    
                    // Create notification for admin
                    createDocument('notifications', [
                        'userId' => 'admin',
                        'type' => 'request_cancelled',
                        'data' => json_encode([
                            'borrowerId' => $request['borrowerId'],
                            'equipmentName' => $request['equipmentName'],
                            'requestId' => $requestId,
                            'cancellationComment' => $data['cancellationComment']
                        ]),
                        'read' => false,
                        'timestamp' => date('c')
                    ]);
                    break;
                    
                default:
                    sendError('Invalid action', 400);
                    return;
            }
            
            if (empty($updateData)) {
                sendError('No update data provided', 400);
                return;
            }
            
            updateDocument('requests', $requestId, $updateData);
            sendSuccess(null, 'Request updated successfully');
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Requests API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    sendError('Server error: ' . $e->getMessage(), 500);
} catch (Error $e) {
    error_log('Requests API Fatal Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    sendError('Server error occurred', 500);
}

