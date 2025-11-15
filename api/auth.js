/**
 * Authentication API Endpoint (Node.js for Vercel)
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
  // Handle CORS
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    const method = req.method;
    
    switch (method) {
      case 'POST': {
        // Login
        const data = req.body || {};
        const userId = sanitizeInput(data.userId);
        const password = sanitizeInput(data.password);
        
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
};

