/**
 * Equipment API Endpoint (Node.js for Vercel)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  isAdmin,
  validateRequired,
  logActivity,
  getAuthenticatedUserId
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method === 'GET') {
      const equipmentId = req.query.id || null;
      
      if (equipmentId) {
        const equipment = await getDocument('equipments', equipmentId);
        if (equipment) {
          const response = sendSuccess(equipment);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        } else {
          const response = sendError('Equipment not found', 404);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
      } else {
        const equipment = await getAllDocuments('equipments');
        const response = sendSuccess(equipment);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
    } else if (req.method === 'POST') {
      const adminCheck = await isAdmin(req);
      if (!adminCheck) {
        const response = sendError('Unauthorized: Admin access required', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const data = req.body || {};
      
      if (data.action) {
        const action = data.action;
        
        if (action === 'update') {
          validateRequired(data, ['id']);
          
          const equipmentId = data.id;
          const updateData = {};
          
          const allowedFields = ['name', 'category', 'status', 'condition', 'location', 'barcode', 'imageUrl'];
          for (const field of allowedFields) {
            if (data[field] !== undefined) {
              updateData[field] = data[field];
            }
          }
          
          if (Object.keys(updateData).length === 0) {
            const response = sendError('No update data provided', 400);
            res.status(response.statusCode).json(JSON.parse(response.body));
            return;
          }
          
          updateData.updatedAt = new Date().toISOString();
          
          const equipment = await getDocument('equipments', equipmentId);
          const equipmentName = equipment ? (equipment.name || equipmentId) : equipmentId;
          
          await updateDocument('equipments', equipmentId, updateData);
          
          await logActivity('update_equipment', {
            equipmentId: equipmentId,
            equipmentName: equipmentName,
            changes: updateData
          }, getAuthenticatedUserId(req));
          
          const response = sendSuccess(null, 'Equipment updated successfully');
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
          
        } else if (action === 'delete') {
          validateRequired(data, ['id']);
          
          const equipmentId = data.id;
          const equipment = await getDocument('equipments', equipmentId);
          
          if (equipment && equipment.imageUrl) {
            // Note: Cloudinary deletion would need to be handled separately
            // For now, we'll just delete from Firestore
          }
          
          const equipmentName = equipment ? (equipment.name || equipmentId) : equipmentId;
          
          await deleteDocument('equipments', equipmentId);
          
          await logActivity('delete_equipment', {
            equipmentId: equipmentId,
            equipmentName: equipmentName
          }, getAuthenticatedUserId(req));
          
          const response = sendSuccess(null, 'Equipment deleted successfully');
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        } else {
          const response = sendError('Invalid action', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
      }
      
      // New equipment creation
      validateRequired(data, ['name', 'category', 'status', 'condition', 'location']);
      
      const equipmentData = {
        name: data.name,
        category: data.category,
        status: data.status,
        condition: data.condition,
        location: data.location,
        barcode: data.barcode || null,
        imageUrl: data.imageUrl || null,
        createdAt: new Date().toISOString()
      };
      
      // Remove null values
      Object.keys(equipmentData).forEach(key => {
        if (equipmentData[key] === null) {
          delete equipmentData[key];
        }
      });
      
      const docId = await createDocument('equipments', equipmentData);
      
      await logActivity('create_equipment', {
        equipmentId: docId,
        equipmentName: equipmentData.name,
        category: equipmentData.category,
        status: equipmentData.status
      }, getAuthenticatedUserId(req));
      
      const response = sendSuccess({ id: docId }, 'Equipment created successfully');
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (req.method === 'PUT') {
      const adminCheck = await isAdmin(req);
      if (!adminCheck) {
        const response = sendError('Unauthorized: Admin access required', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const data = req.body || {};
      validateRequired(data, ['id']);
      
      const equipmentId = data.id;
      const updateData = {};
      
      const allowedFields = ['name', 'category', 'status', 'condition', 'location', 'barcode', 'imageUrl'];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        const response = sendError('No update data provided', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      updateData.updatedAt = new Date().toISOString();
      await updateDocument('equipments', equipmentId, updateData);
      
      const response = sendSuccess(null, 'Equipment updated successfully');
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (req.method === 'DELETE') {
      const adminCheck = await isAdmin(req);
      if (!adminCheck) {
        const response = sendError('Unauthorized: Admin access required', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const equipmentId = req.query.id || null;
      if (!equipmentId) {
        const response = sendError('Equipment ID is required', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const equipment = await getDocument('equipments', equipmentId);
      if (equipment && equipment.imageUrl) {
        // Note: Cloudinary deletion would need to be handled separately
      }
      
      await deleteDocument('equipments', equipmentId);
      
      const response = sendSuccess(null, 'Equipment deleted successfully');
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
  } catch (error) {
    console.error('Equipment API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

