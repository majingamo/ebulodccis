/**
 * Authentication API Endpoint (Node.js for Vercel with Supabase)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getDocument,
  getAuthenticatedUserId,
  sanitizeInput
} = require('./config.js');

// Helper to parse request body for Vercel
function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      resolve({});
      return;
    }
    
    // Vercel might already parse the body
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    
    // Otherwise, parse it manually
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
    req.on('error', () => resolve({}));
  });
}

// Vercel serverless function handler
async function handler(req, res) {
  // Handle CORS
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    const method = req.method;
    
    switch (method) {
      case 'POST': {
        // Vercel automatically parses JSON body
        let body = {};
        if (req.body) {
          if (typeof req.body === 'string') {
            try {
              body = JSON.parse(req.body);
            } catch (e) {
              body = {};
            }
          } else {
            body = req.body;
          }
        }
        const userId = sanitizeInput(body.userId || '');
        const password = sanitizeInput(body.password || '');
        
        if (!userId || !password) {
          const response = sendError('userId and password are required', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        // Check admin
        const admin = await getDocument('admins', userId);
        if (admin && admin.password === password) {
          const response = sendSuccess({
            userId: userId,
            role: 'admin',
            redirect: 'admin_dboard.html'
          });
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        // Check borrower
        const borrower = await getDocument('borrowers', userId);
        if (borrower && borrower.password === password) {
          const response = sendSuccess({
            userId: userId,
            role: 'borrower',
            redirect: 'borrower_dashboard.html'
          });
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        const errorResponse = sendError('Invalid credentials', 401);
        res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
        return;
      }
      
      case 'GET': {
        // Check auth status
        const userId = getAuthenticatedUserId(req);
        if (userId) {
          const admin = await getDocument('admins', userId);
          const borrower = await getDocument('borrowers', userId);
          
          if (admin) {
            const response = sendSuccess({
              authenticated: true,
              userId: userId,
              role: 'admin'
            });
            res.status(response.statusCode).json(JSON.parse(response.body));
            return;
          }
          
          if (borrower) {
            const response = sendSuccess({
              authenticated: true,
              userId: userId,
              role: 'borrower'
            });
            res.status(response.statusCode).json(JSON.parse(response.body));
            return;
          }
        }
        
        const response = sendSuccess({ authenticated: false });
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      case 'DELETE': {
        // Logout (client-side only for stateless API)
        const response = sendSuccess(null, 'Logged out successfully');
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      default: {
        const response = sendError('Method not allowed', 405);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
    }
  } catch (error) {
    console.error('Auth API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
}

// Export for Vercel
module.exports = handler;
