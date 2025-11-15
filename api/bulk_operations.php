<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Rate limiting
if (!checkRateLimit()) {
    exit();
}

// Only admins can perform bulk operations
if (!isAdmin()) {
    sendError('Unauthorized: Admin access required', 403);
    return;
}

try {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
        return;
    }
    
    $data = getRequestData();
    $operation = $data['operation'] ?? null;
    $ids = $data['ids'] ?? [];
    
    if (empty($ids) || !is_array($ids)) {
        sendError('Invalid IDs provided', 400);
        return;
    }
    
    if (empty($operation)) {
        sendError('Operation is required', 400);
        return;
    }
    
    $results = [
        'success' => [],
        'failed' => [],
        'total' => count($ids)
    ];
    
    switch ($operation) {
        case 'update_equipment_status':
            $status = $data['updateData']['status'] ?? null;
            if (!$status) {
                sendError('Status is required', 400);
                return;
            }
            
            foreach ($ids as $equipmentId) {
                try {
                    $equipment = getDocument('equipments', $equipmentId);
                    if (!$equipment) {
                        $results['failed'][] = ['id' => $equipmentId, 'reason' => 'Equipment not found'];
                        continue;
                    }
                    
                    updateDocument('equipments', $equipmentId, [
                        'status' => $status,
                        'updatedAt' => date('c')
                    ]);
                    
                    // Log activity
                    logActivity('bulk_update_equipment_status', [
                        'equipmentId' => $equipmentId,
                        'equipmentName' => $equipment['name'] ?? $equipmentId,
                        'status' => $status,
                        'count' => count($ids)
                    ]);
                    
                    $results['success'][] = $equipmentId;
                } catch (Exception $e) {
                    $results['failed'][] = ['id' => $equipmentId, 'reason' => $e->getMessage()];
                }
            }
            break;
            
        case 'update_equipment_condition':
            $condition = $data['updateData']['condition'] ?? null;
            if (!$condition) {
                sendError('Condition is required', 400);
                return;
            }
            
            foreach ($ids as $equipmentId) {
                try {
                    $equipment = getDocument('equipments', $equipmentId);
                    if (!$equipment) {
                        $results['failed'][] = ['id' => $equipmentId, 'reason' => 'Equipment not found'];
                        continue;
                    }
                    
                    updateDocument('equipments', $equipmentId, [
                        'condition' => $condition,
                        'updatedAt' => date('c')
                    ]);
                    
                    // Log activity
                    logActivity('bulk_update_equipment_condition', [
                        'equipmentId' => $equipmentId,
                        'equipmentName' => $equipment['name'] ?? $equipmentId,
                        'condition' => $condition,
                        'count' => count($ids)
                    ]);
                    
                    $results['success'][] = $equipmentId;
                } catch (Exception $e) {
                    $results['failed'][] = ['id' => $equipmentId, 'reason' => $e->getMessage()];
                }
            }
            break;
            
        case 'approve_requests':
            foreach ($ids as $requestId) {
                try {
                    $request = getDocument('requests', $requestId);
                    if (!$request) {
                        $results['failed'][] = ['id' => $requestId, 'reason' => 'Request not found'];
                        continue;
                    }
                    
                    if (strtolower($request['status'] ?? '') !== 'pending') {
                        $results['failed'][] = ['id' => $requestId, 'reason' => 'Request is not pending'];
                        continue;
                    }
                    
                    // Update request
                    updateDocument('requests', $requestId, [
                        'status' => 'approved',
                        'approvedAt' => date('c'),
                        'approvedBy' => getAuthenticatedUserId()
                    ]);
                    
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
                    logActivity('bulk_approve_request', [
                        'requestId' => $requestId,
                        'borrowerId' => $request['borrowerId'],
                        'equipmentId' => $request['equipmentId'],
                        'equipmentName' => $request['equipmentName'],
                        'count' => count($ids)
                    ]);
                    
                    $results['success'][] = $requestId;
                } catch (Exception $e) {
                    $results['failed'][] = ['id' => $requestId, 'reason' => $e->getMessage()];
                }
            }
            break;
            
        case 'reject_requests':
            $adminComment = $data['adminComment'] ?? 'Bulk rejection';
            
            foreach ($ids as $requestId) {
                try {
                    $request = getDocument('requests', $requestId);
                    if (!$request) {
                        $results['failed'][] = ['id' => $requestId, 'reason' => 'Request not found'];
                        continue;
                    }
                    
                    if (strtolower($request['status'] ?? '') !== 'pending') {
                        $results['failed'][] = ['id' => $requestId, 'reason' => 'Request is not pending'];
                        continue;
                    }
                    
                    // Update request
                    updateDocument('requests', $requestId, [
                        'status' => 'rejected',
                        'rejectedAt' => date('c'),
                        'rejectedBy' => getAuthenticatedUserId(),
                        'adminComment' => $adminComment
                    ]);
                    
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
                    logActivity('bulk_reject_request', [
                        'requestId' => $requestId,
                        'borrowerId' => $request['borrowerId'],
                        'equipmentId' => $request['equipmentId'],
                        'equipmentName' => $request['equipmentName'],
                        'adminComment' => $adminComment,
                        'count' => count($ids)
                    ]);
                    
                    $results['success'][] = $requestId;
                } catch (Exception $e) {
                    $results['failed'][] = ['id' => $requestId, 'reason' => $e->getMessage()];
                }
            }
            break;
            
        case 'delete_equipment':
            foreach ($ids as $equipmentId) {
                try {
                    $equipment = getDocument('equipments', $equipmentId);
                    if (!$equipment) {
                        $results['failed'][] = ['id' => $equipmentId, 'reason' => 'Equipment not found'];
                        continue;
                    }
                    
                    // Check if equipment is currently borrowed
                    if (($equipment['status'] ?? '') === 'Borrowed') {
                        $results['failed'][] = ['id' => $equipmentId, 'reason' => 'Equipment is currently borrowed'];
                        continue;
                    }
                    
                    // Delete image from Cloudinary if exists
                    if (isset($equipment['imageUrl']) && $equipment['imageUrl']) {
                        $imageUrl = $equipment['imageUrl'];
                        if (preg_match('/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/', $imageUrl, $matches)) {
                            $publicId = $matches[1];
                            $deleteData = ['public_id' => $publicId];
                            $deleteUrl = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/../delete_cloudinary_image.php';
                            if (function_exists('curl_init')) {
                                $ch = curl_init($deleteUrl);
                                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                curl_setopt($ch, CURLOPT_POST, true);
                                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($deleteData));
                                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                                curl_exec($ch);
                                curl_close($ch);
                            }
                        }
                    }
                    
                    $equipmentName = $equipment['name'] ?? $equipmentId;
                    
                    deleteDocument('equipments', $equipmentId);
                    
                    // Log activity
                    logActivity('bulk_delete_equipment', [
                        'equipmentId' => $equipmentId,
                        'equipmentName' => $equipmentName,
                        'count' => count($ids)
                    ]);
                    
                    $results['success'][] = $equipmentId;
                } catch (Exception $e) {
                    $results['failed'][] = ['id' => $equipmentId, 'reason' => $e->getMessage()];
                }
            }
            break;
            
        default:
            sendError('Invalid operation', 400);
            return;
    }
    
    $message = 'Bulk operation completed. Success: ' . count($results['success']) . ', Failed: ' . count($results['failed']);
    sendSuccess($results, $message);
    
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
