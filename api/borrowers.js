/**
 * Borrowers API Endpoint (Node.js for Vercel with Supabase)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  getDocument,
  createDocument,
  isAdmin,
  getAuthenticatedUserId,
  validateRequired
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method === 'POST') {
      // Create new borrower
      const adminCheck = await isAdmin(req);
      if (!adminCheck) {
        const response = sendError('Unauthorized: Admin access required', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const data = req.body || {};
      validateRequired(data, ['id', 'password']);
      
      // Check if borrower already exists
      const existingBorrower = await getDocument('borrowers', data.id);
      if (existingBorrower) {
        const response = sendError('Borrower account with this ID already exists', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      // Create borrower with trust_points initialized to 20
      const borrowerData = {
        id: data.id,
        password: data.password,
        name: data.name || null,
        email: data.email || null,
        course: data.course || null,
        yearLevel: data.yearLevel || null,
        status: data.status || 'Active',
        trustPoints: 20, // Initialize with 20 trust points
        createdAt: new Date().toISOString(),
        createdBy: getAuthenticatedUserId(req) || 'admin'
      };
      
      // Remove null values
      Object.keys(borrowerData).forEach(key => {
        if (borrowerData[key] === null) {
          delete borrowerData[key];
        }
      });
      
      await createDocument('borrowers', borrowerData);
      
      const response = sendSuccess({ id: data.id }, 'Borrower account created successfully');
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    if (req.method !== 'GET') {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const borrowerId = req.query.id || null;
    const search = req.query.search || null;
    const authenticatedUserId = getAuthenticatedUserId(req);
    
    if (borrowerId) {
      const adminCheck = await isAdmin(req);
      if (!adminCheck && authenticatedUserId !== borrowerId) {
        const response = sendError('Unauthorized: You can only view your own profile', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const borrower = await getDocument('borrowers', borrowerId);
      if (borrower) {
        const allRequests = await getAllDocuments('requests');
        const borrowerRequests = allRequests.filter(req => req.borrowerId === borrowerId);
        borrower.requests = borrowerRequests;
        
        const response = sendSuccess(borrower);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      } else {
        const response = sendError('Borrower not found', 404);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
    } else {
      const adminCheck = await isAdmin(req);
      if (!adminCheck) {
        const response = sendError('Unauthorized: Admin access required', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      let borrowers = await getAllDocuments('borrowers');
      const allRequests = await getAllDocuments('requests');
      
      borrowers = borrowers.map(borrower => {
        const totalRequests = allRequests.filter(req => req.borrowerId === borrower.id).length;
        return { ...borrower, totalRequests };
      });
      
      if (search) {
        const searchLower = search.toLowerCase();
        borrowers = borrowers.filter(borrower => {
          return (borrower.id || '').toLowerCase().includes(searchLower) ||
                 (borrower.name || '').toLowerCase().includes(searchLower) ||
                 (borrower.email || '').toLowerCase().includes(searchLower) ||
                 (borrower.course || '').toLowerCase().includes(searchLower);
        });
      }
      
      const response = sendSuccess(borrowers);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
  } catch (error) {
    console.error('Borrowers API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

