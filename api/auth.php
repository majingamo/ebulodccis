<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            // Login
            $data = getRequestData();
            validateRequired($data, ['userId', 'password']);
            
            $userId = $data['userId'];
            $password = $data['password'];
            
            // Check admin
            $admin = getDocument('admins', $userId);
            if ($admin && $admin['password'] === $password) {
                ensureSession();
                $_SESSION['userId'] = $userId;
                $_SESSION['userRole'] = 'admin';
                
                sendSuccess([
                    'userId' => $userId,
                    'role' => 'admin',
                    'redirect' => 'admin_dboard.html'
                ], 'Login successful');
            }
            
            // Check borrower
            $borrower = getDocument('borrowers', $userId);
            if ($borrower && $borrower['password'] === $password) {
                ensureSession();
                $_SESSION['userId'] = $userId;
                $_SESSION['userRole'] = 'borrower';
                
                sendSuccess([
                    'userId' => $userId,
                    'role' => 'borrower',
                    'redirect' => 'borrower_dashboard.html'
                ], 'Login successful');
            }
            
            sendError('Invalid credentials', 401);
            break;
            
        case 'GET':
            // Check auth status
            ensureSession();
            $userId = $_SESSION['userId'] ?? null;
            $userRole = $_SESSION['userRole'] ?? null;
            
            if ($userId && $userRole) {
                sendSuccess([
                    'authenticated' => true,
                    'userId' => $userId,
                    'role' => $userRole
                ]);
            } else {
                sendSuccess(['authenticated' => false]);
            }
            break;
            
        case 'DELETE':
            // Logout
            ensureSession();
            session_destroy();
            sendSuccess(null, 'Logged out successfully');
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

