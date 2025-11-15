/**
 * Requests API Endpoint (Node.js for Vercel)
 * This is the main API for handling equipment borrowing requests
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
  isAdmin,
  getAuthenticatedUserId,
  getAuthenticatedUserRole,
  validateRequired,
  logActivity
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method === 'GET') {
      const requestId = req.query.id || null;
      const borrowerId = req.query.borrowerId || null;
      const status = req.query.status || null;
      
      if (requestId) {
        const request = await getDocument('requests', requestId);
        if (request) {
          const response = sendSuccess(request);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        } else {
          const response = sendError('Request not found', 404);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
      } else {
        let allRequests = await getAllDocuments('requests');
        
        if (borrowerId) {
          allRequests = allRequests.filter(req => req.borrowerId === borrowerId);
        }
        if (status) {
          allRequests = allRequests.filter(req => (req.status || '').toLowerCase() === status.toLowerCase());
        }
        
        const response = sendSuccess(allRequests);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
    } else if (req.method === 'POST') {
      const data = req.body || {};
      
      if (data.action) {
        // This is an update action
        const requestId = data.id || null;
        const action = data.action;
        
        if (!requestId) {
          const response = sendError('Request ID is required', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        const request = await getDocument('requests', requestId);
        if (!request) {
          const response = sendError('Request not found', 404);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        let updateData = {};
        const userId = getAuthenticatedUserId(req);
        const adminCheck = await isAdmin(req);
        
        switch (action) {
          case 'approve':
            if (!userId) {
              const response = sendError('Authentication required. Please log in again.', 401);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            if (!adminCheck) {
              const role = await getAuthenticatedUserRole(req);
              const response = sendError(
                `Unauthorized: Admin access required. User ID: ${userId || 'not provided'}, Role: ${role || 'not set'}`,
                403
              );
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            updateData = {
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: userId
            };
            
            if (data.adminComment) {
              updateData.adminComment = data.adminComment;
            }
            
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
            
            await logActivity('approve_request', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName
            }, userId);
            break;
            
          case 'reject':
            if (!userId) {
              const response = sendError('Authentication required. Please log in again.', 401);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            if (!adminCheck) {
              const role = await getAuthenticatedUserRole(req);
              const response = sendError(
                `Unauthorized: Admin access required. User ID: ${userId || 'not provided'}, Role: ${role || 'not set'}`,
                403
              );
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            updateData = {
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: userId
            };
            
            if (data.adminComment) {
              updateData.adminComment = data.adminComment;
            }
            
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
            
            await logActivity('reject_request', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              adminComment: updateData.adminComment || ''
            }, userId);
            break;
            
          case 'return':
            if (!userId) {
              const response = sendError('Authentication required. Please log in again.', 401);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            if (!adminCheck) {
              const role = await getAuthenticatedUserRole(req);
              const response = sendError(
                `Unauthorized: Admin access required. User ID: ${userId || 'not provided'}, Role: ${role || 'not set'}`,
                403
              );
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            validateRequired(data, ['returnCondition']);
            
            updateData = {
              status: 'returned',
              returnedAt: new Date().toISOString(),
              returnedBy: userId,
              returnCondition: data.returnCondition
            };
            
            if (data.returnNotes) {
              updateData.returnNotes = data.returnNotes;
            }
            
            const equipmentUpdate = {
              status: 'Available',
              currentBorrowerId: null,
              borrowedAt: null
            };
            
            if (data.returnCondition === 'Damaged') {
              equipmentUpdate.condition = 'Damaged';
            }
            
            await updateDocument('equipments', request.equipmentId, equipmentUpdate);
            
            await createDocument('equipmentHistory', {
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              borrowerId: request.borrowerId,
              requestId: requestId,
              action: 'returned',
              condition: data.returnCondition,
              notes: data.returnNotes || null,
              timestamp: new Date().toISOString()
            });
            
            await createDocument('notifications', {
              userId: request.borrowerId,
              type: 'equipment_returned',
              data: JSON.stringify({
                equipmentName: request.equipmentName,
                requestId: requestId
              }),
              read: false,
              timestamp: new Date().toISOString()
            });
            
            await logActivity('return_equipment', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              returnCondition: data.returnCondition,
              returnNotes: data.returnNotes || ''
            }, userId);
            break;
            
          case 'cancel':
            validateRequired(data, ['cancellationComment']);
            
            if (request.status !== 'pending') {
              const response = sendError('Can only cancel pending requests', 400);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            updateData = {
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              cancelledBy: data.borrowerId || userId,
              cancellationComment: data.cancellationComment
            };
            
            await createDocument('notifications', {
              userId: 'admin',
              type: 'request_cancelled',
              data: JSON.stringify({
                borrowerId: request.borrowerId,
                equipmentName: request.equipmentName,
                requestId: requestId,
                cancellationComment: data.cancellationComment
              }),
              read: false,
              timestamp: new Date().toISOString()
            });
            
            await logActivity('cancel_request', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName,
              cancellationComment: data.cancellationComment
            }, userId);
            break;
            
          case 'review':
            if (!userId || userId !== request.borrowerId) {
              const response = sendError('Unauthorized: You can only review your own requests', 403);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            if (request.status !== 'returned') {
              const response = sendError('Can only review returned equipment', 400);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            if (!data.review || !data.review.comment) {
              const response = sendError('Feedback comment is required', 400);
              res.status(response.statusCode).json(JSON.parse(response.body));
              return;
            }
            
            const reviewData = data.review;
            updateData = {
              reviewed: true,
              review: {
                comment: reviewData.comment || null,
                timestamp: reviewData.timestamp || new Date().toISOString(),
                equipmentId: reviewData.equipmentId || request.equipmentId
              }
            };
            
            await logActivity('submit_review', {
              requestId: requestId,
              borrowerId: request.borrowerId,
              equipmentId: request.equipmentId,
              equipmentName: request.equipmentName
            }, userId);
            break;
            
          default:
            const response = sendError('Invalid action', 400);
            res.status(response.statusCode).json(JSON.parse(response.body));
            return;
        }
        
        if (Object.keys(updateData).length === 0) {
          const response = sendError('No update data provided', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        
        await updateDocument('requests', requestId, updateData);
        
        const successResponse = sendSuccess(null, 'Request updated successfully');
        res.status(successResponse.statusCode).json(JSON.parse(successResponse.body));
        return;
      }
      
      // This is a new request creation
      validateRequired(data, ['borrowerId', 'equipmentId', 'equipmentName', 'purpose']);
      
      const requestData = {
        borrowerId: data.borrowerId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        purpose: data.purpose,
        requestDate: data.requestDate || null,
        returnDate: data.returnDate || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      // Remove null values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === null) {
          delete requestData[key];
        }
      });
      
      const docId = await createDocument('requests', requestData);
      
      await logActivity('create_request', {
        requestId: docId,
        borrowerId: requestData.borrowerId,
        equipmentId: requestData.equipmentId,
        equipmentName: requestData.equipmentName,
        purpose: requestData.purpose
      }, data.borrowerId);
      
      const response = sendSuccess({ id: docId }, 'Request created successfully');
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (req.method === 'PUT') {
      // Legacy support - same as POST with action
      const data = req.body || {};
      validateRequired(data, ['id', 'action']);
      
      // Redirect to POST logic by setting method
      req.method = 'POST';
      return module.exports(req, res);
      
    } else {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
  } catch (error) {
    console.error('Requests API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

