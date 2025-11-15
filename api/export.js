/**
 * Export API Endpoint (Node.js for Vercel with Supabase)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendError,
  getAllDocuments,
  isAdmin
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
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
    
    let data = {};
    if (req.method === 'POST') {
      data = req.body || {};
    } else {
      data = req.query || {};
    }
    
    const filters = {};
    const filterKeys = ['category', 'status', 'condition', 'borrowerId', 'course', 'yearLevel', 'userId', 'action', 'startDate', 'endDate'];
    for (const key of filterKeys) {
      if (data[key]) {
        filters[key] = data[key];
      }
    }
    
    const type = data.type || 'equipment';
    const format = data.format || 'csv';
    
    let exportData = [];
    let filename = '';
    let headers = [];
    
    switch (type) {
      case 'equipment':
        let allEquipment = await getAllDocuments('equipments');
        
        if (filters.category) {
          allEquipment = allEquipment.filter(item => item.category === filters.category);
        }
        if (filters.status) {
          allEquipment = allEquipment.filter(item => item.status === filters.status);
        }
        if (filters.condition) {
          allEquipment = allEquipment.filter(item => item.condition === filters.condition);
        }
        
        exportData = allEquipment;
        filename = `equipment_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.${format}`;
        headers = ['ID', 'Name', 'Category', 'Status', 'Condition', 'Location', 'Barcode', 'Created At'];
        break;
        
      case 'requests':
        let allRequests = await getAllDocuments('requests');
        
        if (filters.status) {
          allRequests = allRequests.filter(item => (item.status || '').toLowerCase() === filters.status.toLowerCase());
        }
        if (filters.borrowerId) {
          allRequests = allRequests.filter(item => item.borrowerId === filters.borrowerId);
        }
        if (filters.startDate) {
          allRequests = allRequests.filter(item => (item.timestamp || '') >= filters.startDate);
        }
        if (filters.endDate) {
          allRequests = allRequests.filter(item => (item.timestamp || '') <= filters.endDate);
        }
        
        exportData = allRequests;
        filename = `requests_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.${format}`;
        headers = ['ID', 'Borrower ID', 'Equipment ID', 'Equipment Name', 'Purpose', 'Status', 'Request Date', 'Return Date', 'Approved At', 'Returned At'];
        break;
        
      case 'borrowers':
        let allBorrowers = await getAllDocuments('borrowers');
        
        if (filters.course) {
          allBorrowers = allBorrowers.filter(item => item.course === filters.course);
        }
        if (filters.yearLevel) {
          allBorrowers = allBorrowers.filter(item => item.yearLevel === filters.yearLevel);
        }
        
        exportData = allBorrowers;
        filename = `borrowers_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.${format}`;
        headers = ['Student ID', 'Name', 'Email', 'Course', 'Year Level'];
        break;
        
      default:
        const response = sendError('Invalid export type', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
    }
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Add BOM for UTF-8 (Excel compatibility)
      res.write('\uFEFF');
      
      // Write headers
      res.write(headers.join(',') + '\n');
      
      // Write data
      for (const row of exportData) {
        let csvRow = [];
        switch (type) {
          case 'equipment':
            csvRow = [
              row.id || '',
              row.name || '',
              row.category || '',
              row.status || '',
              row.condition || '',
              row.location || '',
              row.barcode || '',
              row.createdAt || ''
            ];
            break;
          case 'requests':
            csvRow = [
              row.id || '',
              row.borrowerId || '',
              row.equipmentId || '',
              row.equipmentName || '',
              row.purpose || '',
              row.status || '',
              row.timestamp || '',
              row.returnDate || '',
              row.approvedAt || '',
              row.returnedAt || ''
            ];
            break;
          case 'borrowers':
            csvRow = [
              row.id || '',
              row.name || '',
              row.email || '',
              row.course || '',
              row.yearLevel || ''
            ];
            break;
        }
        // Escape CSV values
        csvRow = csvRow.map(val => {
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        res.write(csvRow.join(',') + '\n');
      }
      
      res.end();
      return;
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
      return;
    }
  } catch (error) {
    console.error('Export API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

