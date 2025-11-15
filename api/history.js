/**
 * Equipment History API Endpoint (Node.js for Vercel with Supabase)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  getDocument,
  isAdmin
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method !== 'GET') {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const adminCheck = await isAdmin(req);
    if (!adminCheck) {
      const response = sendError('Unauthorized: Admin access required', 403);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const equipmentId = req.query.equipmentId || null;
    if (!equipmentId) {
      const response = sendError('Equipment ID is required', 400);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const equipment = await getDocument('equipments', equipmentId);
    if (!equipment) {
      const response = sendError('Equipment not found', 404);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const allHistory = await getAllDocuments('equipment_history');
    let history = allHistory.filter(item => item.equipmentId === equipmentId);
    
    history.sort((a, b) => {
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      return timeB.localeCompare(timeA);
    });
    
    const response = sendSuccess({
      equipment: {
        id: equipmentId,
        name: equipment.name || 'Unknown'
      },
      history: history
    });
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error) {
    console.error('History API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

