/**
 * API Configuration for Vercel (Node.js)
 * Handles Firebase operations using REST API
 */

// Firebase Configuration - Will be set via environment variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studio-5277928304-db252';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';
const FIRESTORE_API_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Rate limiting storage (in-memory for serverless)
const rateLimitStore = new Map();

// CORS headers
function setCORSHeaders(res) {
  const allowedOrigins = [
    'http://localhost',
    'http://localhost:8080',
    'http://127.0.0.1',
    process.env.ALLOWED_ORIGIN || '*'
  ];
  
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
function sendSuccess(data, statusCode = 200) {
  return {
    statusCode,
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

// Send error response
function sendError(message, statusCode = 400) {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: message
    })
  };
}

// Firebase REST API request
async function firestoreRequest(method, path, data = null) {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${FIRESTORE_API_BASE}${path}${separator}key=${FIREBASE_API_KEY}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data !== null) {
    options.body = JSON.stringify(data);
  }
  
  try {
    // Use require for node-fetch (CommonJS)
    const fetch = require('node-fetch');
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firestore API error (HTTP ${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Firestore request failed: ${error.message}`);
  }
}

// Convert data to Firestore format
function convertToFirestoreFormat(data) {
  const fields = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Number.isInteger(value)) {
      fields[key] = { integerValue: String(value) };
    } else if (Array.isArray(value)) {
      // Handle nested arrays/objects as mapValue
      fields[key] = { mapValue: { fields: convertToFirestoreFormat(value) } };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (typeof value === 'object') {
      // Handle nested objects
      fields[key] = { mapValue: { fields: convertToFirestoreFormat(value) } };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  
  return fields;
}

// Convert from Firestore format
function convertFromFirestoreFormat(firestoreDoc) {
  if (!firestoreDoc || typeof firestoreDoc !== 'object') {
    return {};
  }
  
  // Handle document with 'fields' key
  let fields = firestoreDoc.fields || firestoreDoc;
  
  if (!fields || typeof fields !== 'object') {
    return {};
  }
  
  const data = {};
  
  for (const [key, field] of Object.entries(fields)) {
    if (!field || typeof field !== 'object') {
      continue;
    }
    
    if (field.stringValue !== undefined) {
      data[key] = field.stringValue;
    } else if (field.integerValue !== undefined) {
      data[key] = parseInt(field.integerValue, 10);
    } else if (field.booleanValue !== undefined) {
      data[key] = field.booleanValue;
    } else if (field.timestampValue !== undefined) {
      data[key] = field.timestampValue;
    } else if (field.nullValue !== undefined) {
      data[key] = null;
    } else if (field.mapValue) {
      // Handle nested objects
      if (field.mapValue.fields) {
        data[key] = convertFromFirestoreFormat(field.mapValue.fields);
      } else {
        data[key] = {};
      }
    } else if (field.arrayValue) {
      // Handle arrays
      if (field.arrayValue.values) {
        data[key] = field.arrayValue.values.map(item => {
          if (item.stringValue !== undefined) return item.stringValue;
          if (item.integerValue !== undefined) return parseInt(item.integerValue, 10);
          if (item.booleanValue !== undefined) return item.booleanValue;
          if (item.mapValue?.fields) return convertFromFirestoreFormat(item.mapValue.fields);
          return null;
        });
      } else {
        data[key] = [];
      }
    }
  }
  
  return data;
}

// Get all documents from a collection
async function getAllDocuments(collection) {
  const path = `/${collection}`;
  try {
    const response = await firestoreRequest('GET', path);
    const documents = [];
    
    if (response.documents) {
      for (const doc of response.documents) {
        const docId = doc.name.split('/').pop();
        const data = convertFromFirestoreFormat(doc);
        data.id = docId;
        documents.push(data);
      }
    }
    
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collection}:`, error);
    return [];
  }
}

// Get a single document
async function getDocument(collection, docId) {
  const path = `/${collection}/${docId}`;
  try {
    const response = await firestoreRequest('GET', path);
    const data = convertFromFirestoreFormat(response);
    if (data && Object.keys(data).length > 0) {
      data.id = docId;
    }
    return data;
  } catch (error) {
    console.error(`Error getting document ${collection}/${docId}:`, error);
    return null;
  }
}

// Create a document
async function createDocument(collection, data) {
  const path = `/${collection}`;
  const firestoreData = convertToFirestoreFormat(data);
  
  try {
    const response = await firestoreRequest('POST', path, { fields: firestoreData });
    
    if (response.name) {
      const parts = response.name.split('/');
      return parts[parts.length - 1];
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }
}

// Update a document
async function updateDocument(collection, docId, data) {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data cannot be empty');
  }
  
  const path = `/${collection}/${docId}`;
  const firestoreData = convertToFirestoreFormat(data);
  
  const fieldPaths = Object.keys(data).map(key => encodeURIComponent(key));
  const updateMask = fieldPaths.map(path => `updateMask.fieldPaths=${path}`).join('&');
  
  try {
    await firestoreRequest('PATCH', `${path}?${updateMask}`, { fields: firestoreData });
    return true;
  } catch (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }
}

// Delete a document
async function deleteDocument(collection, docId) {
  const path = `/${collection}/${docId}`;
  try {
    await firestoreRequest('DELETE', path);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Get authenticated user ID from headers
function getAuthenticatedUserId(req) {
  return req.headers['x-user-id'] || null;
}

// Get authenticated user role (simplified - you'll need to implement session/auth)
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
    // If userId is a string (not a req object), use it directly
    let actualUserId = userId;
    if (userId && typeof userId === 'object' && userId.headers) {
      actualUserId = getAuthenticatedUserId(userId);
    }
    
    // Try to determine role if not provided
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
      userId: actualUserId || 'system',
      userRole: actualUserRole || 'unknown',
      details: JSON.stringify(details),
      ipAddress: 'unknown', // Vercel doesn't expose this easily
      userAgent: 'unknown',
      timestamp: new Date().toISOString()
    };
    
    await createDocument('activity_logs', logData);
  } catch (error) {
    // Don't fail the request if logging fails
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
  firestoreRequest,
  convertToFirestoreFormat,
  convertFromFirestoreFormat,
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
  FIREBASE_PROJECT_ID,
  FIREBASE_API_KEY
};

