<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Rate limiting
if (!checkRateLimit()) {
    exit();
}

try {
    if ($method !== 'GET' && $method !== 'POST') {
        sendError('Method not allowed', 405);
        return;
    }
    
    // Only admins can export data
    if (!isAdmin()) {
        sendError('Unauthorized: Admin access required', 403);
        return;
    }
    
    // Get data from request
    if ($method === 'POST') {
        $data = getRequestData();
        $filters = $data['filters'] ?? [];
    } else {
        $data = $_GET;
        // Parse filters from query string
        $filters = [];
        foreach ($_GET as $key => $value) {
            if (in_array($key, ['category', 'status', 'condition', 'borrowerId', 'course', 'yearLevel', 'userId', 'action', 'startDate', 'endDate'])) {
                $filters[$key] = $value;
            }
        }
    }
    
    $type = $data['type'] ?? 'equipment'; // equipment, requests, borrowers
    $format = $data['format'] ?? 'csv'; // csv, json
    
    $exportData = [];
    $filename = '';
    $headers = [];
    
    switch ($type) {
        case 'equipment':
            $allEquipment = getAllDocuments('equipments');
            
            // Apply filters
            if (isset($filters['category'])) {
                $allEquipment = array_filter($allEquipment, function($item) use ($filters) {
                    return ($item['category'] ?? '') === $filters['category'];
                });
            }
            if (isset($filters['status'])) {
                $allEquipment = array_filter($allEquipment, function($item) use ($filters) {
                    return ($item['status'] ?? '') === $filters['status'];
                });
            }
            if (isset($filters['condition'])) {
                $allEquipment = array_filter($allEquipment, function($item) use ($filters) {
                    return ($item['condition'] ?? '') === $filters['condition'];
                });
            }
            
            $exportData = array_values($allEquipment);
            $filename = 'equipment_' . date('Y-m-d_His') . '.' . $format;
            $headers = ['ID', 'Name', 'Category', 'Status', 'Condition', 'Location', 'Barcode', 'Created At'];
            break;
            
        case 'requests':
            $allRequests = getAllDocuments('requests');
            
            // Apply filters
            if (isset($filters['status'])) {
                $allRequests = array_filter($allRequests, function($item) use ($filters) {
                    return strtolower($item['status'] ?? '') === strtolower($filters['status']);
                });
            }
            if (isset($filters['borrowerId'])) {
                $allRequests = array_filter($allRequests, function($item) use ($filters) {
                    return ($item['borrowerId'] ?? '') === $filters['borrowerId'];
                });
            }
            if (isset($filters['startDate'])) {
                $allRequests = array_filter($allRequests, function($item) use ($filters) {
                    $timestamp = $item['timestamp'] ?? '';
                    return $timestamp >= $filters['startDate'];
                });
            }
            if (isset($filters['endDate'])) {
                $allRequests = array_filter($allRequests, function($item) use ($filters) {
                    $timestamp = $item['timestamp'] ?? '';
                    return $timestamp <= $filters['endDate'];
                });
            }
            
            $exportData = array_values($allRequests);
            $filename = 'requests_' . date('Y-m-d_His') . '.' . $format;
            $headers = ['ID', 'Borrower ID', 'Equipment ID', 'Equipment Name', 'Purpose', 'Status', 'Request Date', 'Return Date', 'Approved At', 'Returned At'];
            break;
            
        case 'borrowers':
            $allBorrowers = getAllDocuments('borrowers');
            
            // Apply filters
            if (isset($filters['course'])) {
                $allBorrowers = array_filter($allBorrowers, function($item) use ($filters) {
                    return ($item['course'] ?? '') === $filters['course'];
                });
            }
            if (isset($filters['yearLevel'])) {
                $allBorrowers = array_filter($allBorrowers, function($item) use ($filters) {
                    return ($item['yearLevel'] ?? '') === $filters['yearLevel'];
                });
            }
            
            $exportData = array_values($allBorrowers);
            $filename = 'borrowers_' . date('Y-m-d_His') . '.' . $format;
            $headers = ['Student ID', 'Name', 'Email', 'Course', 'Year Level'];
            break;
            
        default:
            sendError('Invalid export type', 400);
            return;
    }
    
    if ($format === 'csv') {
        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Open output stream
        $output = fopen('php://output', 'w');
        
        // Add BOM for UTF-8 (Excel compatibility)
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Write headers
        fputcsv($output, $headers);
        
        // Write data
        foreach ($exportData as $row) {
            $csvRow = [];
            switch ($type) {
                case 'equipment':
                    $csvRow = [
                        $row['id'] ?? '',
                        $row['name'] ?? '',
                        $row['category'] ?? '',
                        $row['status'] ?? '',
                        $row['condition'] ?? '',
                        $row['location'] ?? '',
                        $row['barcode'] ?? '',
                        $row['createdAt'] ?? ''
                    ];
                    break;
                case 'requests':
                    $csvRow = [
                        $row['id'] ?? '',
                        $row['borrowerId'] ?? '',
                        $row['equipmentId'] ?? '',
                        $row['equipmentName'] ?? '',
                        $row['purpose'] ?? '',
                        $row['status'] ?? '',
                        $row['timestamp'] ?? '',
                        $row['returnDate'] ?? '',
                        $row['approvedAt'] ?? '',
                        $row['returnedAt'] ?? ''
                    ];
                    break;
                case 'borrowers':
                    $csvRow = [
                        $row['id'] ?? '',
                        $row['name'] ?? '',
                        $row['email'] ?? '',
                        $row['course'] ?? '',
                        $row['yearLevel'] ?? ''
                    ];
                    break;
            }
            fputcsv($output, $csvRow);
        }
        
        fclose($output);
        exit();
    } else {
        // JSON format
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo json_encode($exportData, JSON_PRETTY_PRINT);
        exit();
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
