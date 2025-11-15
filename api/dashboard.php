<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'stats';

try {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }
    
    $role = getAuthenticatedUserRole();
    $userId = getAuthenticatedUserId();
    
    // Debug logging
    error_log("Dashboard API - Type: $type, UserId: " . ($userId ?: 'null') . ", Role: " . ($role ?: 'null'));
    
    if ($type === 'stats') {
        if (isAdmin()) {
            $equipment = getAllDocuments('equipments');
            $requests = getAllDocuments('requests');
            
            $total = count($equipment);
            $available = 0;
            $borrowed = 0;
            
            foreach ($equipment as $item) {
                if ($item['status'] === 'Available') $available++;
                if ($item['status'] === 'Borrowed') $borrowed++;
            }
            
            $pending = 0;
            foreach ($requests as $req) {
                if (strtolower($req['status'] ?? '') === 'pending') {
                    $pending++;
                }
            }
            
            sendSuccess([
                'totalEquipment' => $total,
                'availableEquipment' => $available,
                'borrowedEquipment' => $borrowed,
                'pendingRequests' => $pending
            ]);
        } else {
            error_log("Dashboard API - Unauthorized access attempt. UserId: " . ($userId ?: 'null') . ", Role: " . ($role ?: 'null'));
            sendError('Unauthorized: Admin access required. UserId: ' . ($userId ?: 'null') . ', Role: ' . ($role ?: 'null'), 403);
        }
    } else if ($type === 'recent_activity') {
        $requests = getAllDocuments('requests');
        
        // Sort by timestamp (most recent first)
        usort($requests, function($a, $b) {
            $timeA = $a['timestamp'] ?? '';
            $timeB = $b['timestamp'] ?? '';
            return strcmp($timeB, $timeA);
        });
        
        // Get top 5
        $recent = array_slice($requests, 0, 5);
        
        sendSuccess($recent);
    } else if ($type === 'chart_data') {
        if (!isAdmin()) {
            sendError('Unauthorized', 403);
        }
        
        $equipment = getAllDocuments('equipments');
        $requests = getAllDocuments('requests');
        
        // Equipment Status Chart Data
        $equipmentStatus = ['Available' => 0, 'Borrowed' => 0, 'Under Repair' => 0];
        foreach ($equipment as $item) {
            $status = $item['status'] ?? 'Available';
            if (isset($equipmentStatus[$status])) {
                $equipmentStatus[$status]++;
            }
        }
        
        // Request Status Chart Data
        $requestStatus = ['pending' => 0, 'approved' => 0, 'rejected' => 0, 'returned' => 0, 'cancelled' => 0];
        foreach ($requests as $req) {
            $status = strtolower($req['status'] ?? 'pending');
            if (isset($requestStatus[$status])) {
                $requestStatus[$status]++;
            }
        }
        
        // Monthly Activity Chart Data (last 6 months)
        $monthlyActivity = [];
        $currentDate = new DateTime();
        for ($i = 5; $i >= 0; $i--) {
            $date = clone $currentDate;
            $date->modify("-$i months");
            $monthKey = $date->format('Y-m');
            $monthLabel = $date->format('M Y');
            
            $count = 0;
            foreach ($requests as $req) {
                $reqDate = $req['timestamp'] ?? '';
                if ($reqDate && strpos($reqDate, $monthKey) === 0) {
                    $count++;
                }
            }
            
            $monthlyActivity[] = ['month' => $monthLabel, 'count' => $count];
        }
        
        sendSuccess([
            'equipmentStatus' => $equipmentStatus,
            'requestStatus' => $requestStatus,
            'monthlyActivity' => $monthlyActivity
        ]);
    } else {
        sendError('Invalid type', 400);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}


