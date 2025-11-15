/**
 * API Configuration for Vercel (Node.js)
 * Handles Supabase database operations
 */

// Supabase Configuration - Will be set via environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL and Anon Key must be set in environment variables');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// CORS headers
function setCORSHeaders(res) {
  const origin = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : (process.env.ALLOWED_ORIGIN || '*');
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
}

// Handle preflight requests
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

// Send success response
function sendSuccess(data, message = null) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: data,
      message: message
    })
  };
}

// Send error response
function sendError(message, statusCode = 400) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      success: false,
      error: message
    })
  };
}

// Database Helper Functions

// Convert snake_case to camelCase
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    const camelObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(value);
    }
    return camelObj;
  }
  return obj;
}

// Convert camelCase to snake_case
function toSnakeCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    const snakeObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = toSnakeCase(value);
    }
    return snakeObj;
  }
  return obj;
}

// Get all documents from a collection (table)
async function getAllDocuments(table) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(table)
      .select('*');
    
    if (error) {
      console.error(`Error getting documents from ${table}:`, error);
      return [];
    }
    
    // Convert snake_case to camelCase for API compatibility
    return toCamelCase(data || []);
  } catch (error) {
    console.error(`Error getting documents from ${table}:`, error);
    return [];
  }
}

// Get a single document by ID
async function getDocument(table, docId) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', docId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error(`Error getting document ${table}/${docId}:`, error);
      return null;
    }
    
    // Convert snake_case to camelCase for API compatibility
    return toCamelCase(data);
  } catch (error) {
    console.error(`Error getting document ${table}/${docId}:`, error);
    return null;
  }
}

// Create a document
async function createDocument(table, data) {
  try {
    const client = getSupabaseClient();
    // Convert camelCase to snake_case for database
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await client
      .from(table)
      .insert(snakeData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
    
    // Return ID in camelCase format
    const camelResult = toCamelCase(result);
    return camelResult.id || camelResult;
  } catch (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }
}

// Update a document
async function updateDocument(table, docId, data) {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data cannot be empty');
  }
  
  try {
    const client = getSupabaseClient();
    // Convert camelCase to snake_case for database
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await client
      .from(table)
      .update(snakeData)
      .eq('id', docId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }
}

// Delete a document
async function deleteDocument(table, docId) {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', docId);
    
    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Get authenticated user ID from headers
function getAuthenticatedUserId(req) {
  return req.headers['x-user-id'] || null;
}

// Get authenticated user role
async function getAuthenticatedUserRole(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return null;
  
  // Check if user is admin
  const admin = await getDocument('admins', userId);
  if (admin) return 'admin';
  
  // Check if user is borrower
  const borrower = await getDocument('borrowers', userId);
  if (borrower) return 'borrower';
  
  return null;
}

// Check if user is admin
async function isAdmin(req) {
  const role = await getAuthenticatedUserRole(req);
  return role === 'admin';
}

// Sanitize input
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

// Validate required fields
function validateRequired(data, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (!data || !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new Error('Missing required fields: ' + missing.join(', '));
  }
}

// Log activity
async function logActivity(action, details = {}, userId = null, userRole = null) {
  try {
    let actualUserId = userId;
    if (userId && typeof userId === 'object' && userId.headers) {
      actualUserId = getAuthenticatedUserId(userId);
    }
    
    let actualUserRole = userRole;
    if (!actualUserRole && actualUserId && typeof actualUserId === 'string') {
      try {
        actualUserRole = await getAuthenticatedUserRole({ headers: { 'x-user-id': actualUserId } });
      } catch (e) {
        // Ignore
      }
    }
    
    const logData = {
      action: action,
      user_id: actualUserId || 'system',
      user_role: actualUserRole || 'unknown',
      details: JSON.stringify(details),
      ip_address: 'unknown',
      user_agent: 'unknown',
      timestamp: new Date().toISOString()
    };
    
    await createDocument('activity_logs', logData);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Get request body data
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET') {
      resolve({});
      return;
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

module.exports = {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getAuthenticatedUserId,
  getAuthenticatedUserRole,
  isAdmin,
  sanitizeInput,
  validateRequired,
  logActivity,
  getRequestBody,
  getSupabaseClient,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};
