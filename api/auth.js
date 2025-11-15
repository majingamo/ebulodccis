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

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, Authorization');
    res.status(200).end();
    return;
  }
  
  setCORSHeaders(res);
  
  try {
    const method = req.method;
    
    switch (method) {
      case 'POST': {
        // Parse request body - Vercel may auto-parse or we need to parse manually
        let body = {};
        if (req.body) {
          if (typeof req.body === 'string') {
            try {
              body = JSON.parse(req.body);
            } catch (e) {
              console.error('JSON parse error:', e);
              body = {};
            }
          } else {
            body = req.body;
          }
        } else {
          // If body is not available, try to read from stream
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyString = Buffer.concat(chunks).toString();
          if (bodyString) {
            try {
              body = JSON.parse(bodyString);
            } catch (e) {
              body = {};
            }
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
    console.error('Error stack:', error.stack);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};
