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
            $equipmentId = $_GET['id'] ?? null;
            
            if ($equipmentId) {
                $equipment = getDocument('equipments', $equipmentId);
                if ($equipment) {
                    sendSuccess($equipment);
                } else {
                    sendError('Equipment not found', 404);
                }
            } else {
                $equipment = getAllDocuments('equipments');
                sendSuccess($equipment);
            }
            break;
            
        case 'POST':
            if (!isAdmin()) {
                sendError('Unauthorized: Admin access required', 403);
                return;
            }
            
            $data = getRequestData();
            
            // Check if this is an update/delete action (using POST instead of PUT/DELETE for InfinityFree compatibility)
            if (isset($data['action'])) {
                $action = $data['action'];
                
                if ($action === 'update') {
                    validateRequired($data, ['id']);
                    
                    $equipmentId = $data['id'];
                    $updateData = [];
                    
                    $allowedFields = ['name', 'category', 'status', 'condition', 'location', 'barcode', 'imageUrl'];
                    foreach ($allowedFields as $field) {
                        if (isset($data[$field])) {
                            $updateData[$field] = $data[$field];
                        }
                    }
                    
                    if (empty($updateData)) {
                        sendError('No update data provided', 400);
                        return;
                    }
                    
                    $updateData['updatedAt'] = date('c');
                    
                    // Get equipment name for logging
                    $equipment = getDocument('equipments', $equipmentId);
                    $equipmentName = $equipment['name'] ?? $equipmentId;
                    
                    updateDocument('equipments', $equipmentId, $updateData);
                    
                    // Log activity
                    logActivity('update_equipment', [
                        'equipmentId' => $equipmentId,
                        'equipmentName' => $equipmentName,
                        'changes' => $updateData
                    ]);
                    
                    sendSuccess(null, 'Equipment updated successfully');
                    return;
                } elseif ($action === 'delete') {
                    validateRequired($data, ['id']);
                    
                    $equipmentId = $data['id'];
                    
                    // Get equipment to check for image
                    $equipment = getDocument('equipments', $equipmentId);
                    if ($equipment && isset($equipment['imageUrl']) && $equipment['imageUrl']) {
                        // Delete image from Cloudinary
                        $imageUrl = $equipment['imageUrl'];
                        // Extract public_id from Cloudinary URL
                        // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
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
                    
                    // Get equipment name for logging
                    $equipmentName = $equipment['name'] ?? $equipmentId;
                    
                    deleteDocument('equipments', $equipmentId);
                    
                    // Log activity
                    logActivity('delete_equipment', [
                        'equipmentId' => $equipmentId,
                        'equipmentName' => $equipmentName
                    ]);
                    
                    sendSuccess(null, 'Equipment deleted successfully');
                    return;
                } else {
                    sendError('Invalid action', 400);
                    return;
                }
            }
            
            // This is a new equipment creation
            validateRequired($data, ['name', 'category', 'status', 'condition', 'location']);
            
            $equipmentData = [
                'name' => $data['name'],
                'category' => $data['category'],
                'status' => $data['status'],
                'condition' => $data['condition'],
                'location' => $data['location'],
                'barcode' => $data['barcode'] ?? null,
                'imageUrl' => $data['imageUrl'] ?? null,
                'createdAt' => date('c')
            ];
            
            // Remove null values
            $equipmentData = array_filter($equipmentData, function($value) {
                return $value !== null;
            });
            
            $docId = createDocument('equipments', $equipmentData);
            
            // Log activity
            logActivity('create_equipment', [
                'equipmentId' => $docId,
                'equipmentName' => $equipmentData['name'],
                'category' => $equipmentData['category'],
                'status' => $equipmentData['status']
            ]);
            
            sendSuccess(['id' => $docId], 'Equipment created successfully');
            break;
            
        case 'PUT':
            // Legacy support - redirect to POST with action=update
            if (!isAdmin()) {
                sendError('Unauthorized: Admin access required', 403);
                return;
            }
            
            $data = getRequestData();
            validateRequired($data, ['id']);
            
            $equipmentId = $data['id'];
            $updateData = [];
            
            $allowedFields = ['name', 'category', 'status', 'condition', 'location', 'barcode', 'imageUrl'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                sendError('No update data provided', 400);
                return;
            }
            
            $updateData['updatedAt'] = date('c');
            
            updateDocument('equipments', $equipmentId, $updateData);
            sendSuccess(null, 'Equipment updated successfully');
            break;
            
        case 'DELETE':
            // Legacy support - redirect to POST with action=delete
            if (!isAdmin()) {
                sendError('Unauthorized: Admin access required', 403);
                return;
            }
            
            $equipmentId = $_GET['id'] ?? null;
            if (!$equipmentId) {
                sendError('Equipment ID is required');
                return;
            }
            
            // Get equipment to check for image
            $equipment = getDocument('equipments', $equipmentId);
            if ($equipment && isset($equipment['imageUrl']) && $equipment['imageUrl']) {
                // Delete image from Cloudinary
                $imageUrl = $equipment['imageUrl'];
                // Extract public_id from Cloudinary URL
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
            
            deleteDocument('equipments', $equipmentId);
            sendSuccess(null, 'Equipment deleted successfully');
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

