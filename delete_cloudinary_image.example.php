<?php
/**
 * Delete image from Cloudinary
 * This endpoint handles secure deletion using the API secret
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to delete_cloudinary_image.php
 * 2. Replace all placeholder values with your actual Cloudinary credentials
 * 3. Never commit delete_cloudinary_image.php to version control
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Cloudinary Configuration
// Get these from: https://console.cloudinary.com/settings/api-keys
$cloudName = 'YOUR_CLOUDINARY_CLOUD_NAME';
$apiKey = 'YOUR_CLOUDINARY_API_KEY';
$apiSecret = 'YOUR_CLOUDINARY_API_SECRET'; // ⚠️ Keep this secret!

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the public_id from request
$input = json_decode(file_get_contents('php://input'), true);
$publicId = $input['public_id'] ?? null;

if (!$publicId) {
    http_response_code(400);
    echo json_encode(['error' => 'public_id is required']);
    exit;
}

// Generate signature for Cloudinary API
$timestamp = time();
$signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

// Cloudinary Admin API endpoint for deletion
$url = "https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy";

// Prepare data
$data = [
    'public_id' => $publicId,
    'timestamp' => $timestamp,
    'api_key' => $apiKey,
    'signature' => $signature
];

// Make the deletion request
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo json_encode(['success' => true, 'message' => 'Image deleted successfully']);
} else {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Failed to delete image', 'details' => $response]);
}
?>


