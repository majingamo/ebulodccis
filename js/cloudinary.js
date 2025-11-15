// Cloudinary Configuration
const cloudinaryConfig = {
  cloudName: 'di0mooaf5',
  apiKey: '591743999435183',
  uploadPreset: 'equipment_upload'
};

// Cloudinary Upload URL
const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

/**
 * Upload image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} equipmentId - Optional equipment ID for naming
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
async function uploadImageToCloudinary(file, equipmentId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', 'equipment'); // Organize images in equipment folder
    
    // Optional: Add public_id for better organization
    if (equipmentId) {
      const timestamp = Date.now();
      const fileName = file.name.split('.')[0]; // Remove extension
      formData.append('public_id', `equipment/${equipmentId}_${timestamp}_${fileName}`);
    }

    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Return the secure HTTPS URL
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param {string} imageUrl - The Cloudinary image URL
 * @returns {string|null} - The public_id or null if invalid
 */
function extractPublicIdFromUrl(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return null;
    }
    
    // Cloudinary URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v1234567890/folder/filename.jpg
    // or: https://res.cloudinary.com/CLOUD_NAME/image/upload/folder/filename.jpg
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return null;
    }
    
    // Get everything after 'upload' and before the file extension
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = pathAfterUpload.split('.')[0]; // Remove file extension
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

// Make functions globally available for browser use
// (They're already in global scope, but this ensures they're accessible)
if (typeof window !== 'undefined') {
  window.uploadImageToCloudinary = uploadImageToCloudinary;
  window.extractPublicIdFromUrl = extractPublicIdFromUrl;
  window.cloudinaryConfig = cloudinaryConfig;
}

// Export functions for use in other files (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    uploadImageToCloudinary,
    extractPublicIdFromUrl,
    cloudinaryConfig
  };
}

