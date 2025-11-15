/**
 * Bulk Operations API Endpoint (Node.js for Vercel)
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
  getAuthenticatedUserId,
  validateRequired,
  logActivity
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  const adminCheck = await isAdmin(req);
  if (!adminCheck) {
    const response = sendError('Unauthorized: Admin access required', 403);
    res.status(response.statusCode).json(JSON.parse(response.body));
    return;
  }
  
  try {
    if (req.method !== 'POST') {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const data = req.body || {};
    const operation = data.operation || null;
    const ids = data.ids || [];
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      const response = sendError('Invalid IDs provided', 400);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    if (!operation) {
      const response = sendError('Operation is required', 400);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
    
    const results = {
      success: [],
      failed: [],
      total: ids.length
    };
    
    const userId = getAuthenticatedUserId(req);
    
    switch (operation) {
      case 'update_equipment_status':
        const status = data.updateData?.status || null;
        if (!status) {
          const response = sendError('Status is required', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        for (const equipmentId of ids) {
          try {
            const equipment = await getDocument('equipments', equipmentId);
            if (!equipment) {
              results.failed.push({ id: equipmentId, reason: 'Equipment not found' });
              continue;
            }
            
            await updateDocument('equipments', equipmentId, {
              status: status,
              updatedAt: new Date().toISOString()
            });
            
            await logActivity('bulk_update_equipment_status', {
              equipmentId: equipmentId,
              equipmentName: equipment.name || equipmentId,
              status: status,
              count: ids.length
            }, userId);
            
            results.success.push(equipmentId);
          } catch (error) {
            results.failed.push({ id: equipmentId, reason: error.message });
          }
        }
        break;
        
      case 'update_equipment_condition':
        const condition = data.updateData?.condition || null;
        if (!condition) {
          const response = sendError('Condition is required', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        for (const equipmentId of ids) {
          try {
            const equipment = await getDocument('equipments', equipmentId);
            if (!equipment) {
              results.failed.push({ id: equipmentId, reason: 'Equipment not found' });
              continue;
            }
            
            await updateDocument('equipments', equipmentId, {
              condition: condition,
              updatedAt: new Date().toISOString()
            });
            
            await logActivity('bulk_update_equipment_condition', {
              equipmentId: equipmentId,
              equipmentName: equipment.name || equipmentId,
              condition: condition,
              count: ids.length
            }, userId);
            
            results.success.push(equipmentId);
          } catch (error) {
            results.failed.push({ id: equipmentId, reason: error.message });
          }
        }
        break;
        
      case 'approve_requests':
        for (const requestId of ids) {
          try {
            const request = await getDocument('requests', requestId);
            if (!request) {
              results.failed.push({ id: requestId, reason: 'Request not found' });
              continue;
            }
            
            if ((request.status || '').toLowerCase() !== 'pending') {
              results.failed.push({ id: requestId, reason: 'Request is not pending' });
              continue;
            }
            
            await updateDocument('requests', requestId, {
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: userId
            });
            
            await updateDocument('equipments', request.equipmentId, {
              status: 'Borrowed',
              currentBorrowerId: request.borrowerId,
              borrowedAt: new Date().toISOString()
            });
            
            await createDocument('equipmentHistory', {
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              borrowerId: request.borrowerId,
              requestId: requestId,
              action: 'borrowed',
              timestamp: new Date().toISOString(),
              expectedReturnDate: request.returnDate || null
            });
            
            await createDocument('notifications', {
              userId: request.borrowerId,
              type: 'request_approved',
              data: JSON.stringify({
                equipmentName: request.equipmentName,
                requestId: requestId
              }),
              read: false,
              timestamp: new Date().toISOString()
            });
            
            await logActivity('bulk_approve_request', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              count: ids.length
            }, userId);
            
            results.success.push(requestId);
          } catch (error) {
            results.failed.push({ id: requestId, reason: error.message });
          }
        }
        break;
        
      case 'reject_requests':
        const adminComment = data.adminComment || 'Bulk rejection';
        
        for (const requestId of ids) {
          try {
            const request = await getDocument('requests', requestId);
            if (!request) {
              results.failed.push({ id: requestId, reason: 'Request not found' });
              continue;
            }
            
            if ((request.status || '').toLowerCase() !== 'pending') {
              results.failed.push({ id: requestId, reason: 'Request is not pending' });
              continue;
            }
            
            await updateDocument('requests', requestId, {
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: userId,
              adminComment: adminComment
            });
            
            await createDocument('notifications', {
              userId: request.borrowerId,
              type: 'request_rejected',
              data: JSON.stringify({
                equipmentName: request.equipmentName,
                requestId: requestId
              }),
              read: false,
              timestamp: new Date().toISOString()
            });
            
            await logActivity('bulk_reject_request', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              adminComment: adminComment,
              count: ids.length
            }, userId);
            
            results.success.push(requestId);
          } catch (error) {
            results.failed.push({ id: requestId, reason: error.message });
          }
        }
        break;
        
      case 'delete_equipment':
        for (const equipmentId of ids) {
          try {
            const equipment = await getDocument('equipments', equipmentId);
            if (!equipment) {
              results.failed.push({ id: equipmentId, reason: 'Equipment not found' });
              continue;
            }
            
            if ((equipment.status || '') === 'Borrowed') {
              results.failed.push({ id: equipmentId, reason: 'Equipment is currently borrowed' });
              continue;
            }
            
            // Note: Cloudinary deletion would need to be handled separately
            if (equipment.imageUrl) {
              // Image deletion logic would go here
            }
            
            const equipmentName = equipment.name || equipmentId;
            await deleteDocument('equipments', equipmentId);
            
            await logActivity('bulk_delete_equipment', {
              equipmentId: equipmentId,
              equipmentName: equipmentName,
              count: ids.length
            }, userId);
            
            results.success.push(equipmentId);
          } catch (error) {
            results.failed.push({ id: equipmentId, reason: error.message });
          }
        }
        break;
        
      default:
        const response = sendError('Invalid operation', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
    }
    
    const message = `Bulk operation completed. Success: ${results.success.length}, Failed: ${results.failed.length}`;
    const response = sendSuccess(results, message);
    res.status(response.statusCode).json(JSON.parse(response.body));
    
  } catch (error) {
    console.error('Bulk operations API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

