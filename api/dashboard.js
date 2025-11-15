/**
 * Dashboard API Endpoint (Node.js for Vercel with Supabase)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  isAdmin,
  getAuthenticatedUserId
} = require('./config.js');

module.exports = async (req, res) => {
  // Handle CORS
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method !== 'GET') {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const type = req.query.type || 'stats';
    const userId = getAuthenticatedUserId(req);
    const adminCheck = await isAdmin(req);
    
    if (type === 'stats') {
      if (!adminCheck) {
        const response = sendError(
          `Unauthorized: Admin access required. UserId: ${userId || 'null'}`,
          403
        );
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const equipment = await getAllDocuments('equipments');
      const requests = await getAllDocuments('requests');
      
      let total = equipment.length;
      let available = 0;
      let borrowed = 0;
      
      for (const item of equipment) {
        if (item.status === 'Available') available++;
        if (item.status === 'Borrowed') borrowed++;
      }
      
      let pending = 0;
      for (const req of requests) {
        const status = (req.status || '').toLowerCase();
        if (status === 'pending') pending++;
      }
      
      const response = sendSuccess({
        totalEquipment: total,
        availableEquipment: available,
        borrowedEquipment: borrowed,
        pendingRequests: pending
      });
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (type === 'recent_activity') {
      const requests = await getAllDocuments('requests');
      
      // Sort by timestamp (most recent first)
      requests.sort((a, b) => {
        const timeA = a.timestamp || '';
        const timeB = b.timestamp || '';
        return timeB.localeCompare(timeA);
      });
      
      // Get top 5
      const recent = requests.slice(0, 5);
      
      const response = sendSuccess(recent);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (type === 'chart_data') {
      if (!adminCheck) {
        const response = sendError('Unauthorized', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const equipment = await getAllDocuments('equipments');
      const requests = await getAllDocuments('requests');
      
      // Equipment Status Chart Data
      const equipmentStatus = { 'Available': 0, 'Borrowed': 0, 'Under Repair': 0 };
      for (const item of equipment) {
        const status = item.status || 'Available';
        if (equipmentStatus.hasOwnProperty(status)) {
          equipmentStatus[status]++;
        }
      }
      
      // Request Status Chart Data
      const requestStatus = {
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'returned': 0,
        'cancelled': 0
      };
      for (const req of requests) {
        const status = (req.status || 'pending').toLowerCase();
        if (requestStatus.hasOwnProperty(status)) {
          requestStatus[status]++;
        }
      }
      
      // Monthly Activity Chart Data (last 6 months)
      const monthlyActivity = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        let count = 0;
        for (const req of requests) {
          const reqDate = req.timestamp || '';
          if (reqDate && reqDate.startsWith(monthKey)) {
            count++;
          }
        }
        
        monthlyActivity.push({ month: monthLabel, count: count });
      }
      
      const response = sendSuccess({
        equipmentStatus: equipmentStatus,
        requestStatus: requestStatus,
        monthlyActivity: monthlyActivity
      });
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else {
      const response = sendError('Invalid type', 400);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

