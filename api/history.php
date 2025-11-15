<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$equipmentId = $_GET['equipmentId'] ?? null;

try {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }
    
    if (!isAdmin()) {
        sendError('Unauthorized: Admin access required', 403);
    }
    
    if (!$equipmentId) {
        sendError('Equipment ID is required');
    }
    
    $equipment = getDocument('equipments', $equipmentId);
    if (!$equipment) {
        sendError('Equipment not found', 404);
    }
    
    $allHistory = getAllDocuments('equipmentHistory');
    $history = array_filter($allHistory, function($item) use ($equipmentId) {
        return ($item['equipmentId'] ?? null) === $equipmentId;
    });
    
    // Sort by timestamp (newest first)
    usort($history, function($a, $b) {
        $timeA = $a['timestamp'] ?? '';
        $timeB = $b['timestamp'] ?? '';
        return strcmp($timeB, $timeA);
    });
    
    sendSuccess([
        'equipment' => [
            'id' => $equipmentId,
            'name' => $equipment['name'] ?? 'Unknown'
        ],
        'history' => array_values($history)
    ]);
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

