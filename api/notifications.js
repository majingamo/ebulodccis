/**
 * Notifications API Endpoint (Node.js for Vercel)
 */
const {
  setCORSHeaders,
  handlePreflight,
  sendSuccess,
  sendError,
  getAllDocuments,
  updateDocument,
  getAuthenticatedUserId,
  getAuthenticatedUserRole
} = require('./config.js');

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCORSHeaders(res);
  
  try {
    if (req.method === 'GET') {
      const userId = getAuthenticatedUserId(req);
      const role = await getAuthenticatedUserRole(req);
      
      if (!userId) {
        const response = sendError('Unauthorized', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      const allNotifications = await getAllDocuments('notifications');
      let notifications = [];
      
      if (role === 'admin') {
        notifications = allNotifications.filter(notif => notif.userId === 'admin');
        
        const allRequests = await getAllDocuments('requests');
        const pendingCount = allRequests.filter(req => (req.status || '').toLowerCase() === 'pending').length;
        
        if (pendingCount > 0) {
          notifications.unshift({
            id: 'pending_requests',
            type: 'pending_requests',
            data: JSON.stringify({ count: pendingCount }),
            read: false,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        notifications = allNotifications.filter(notif => notif.userId === userId);
      }
      
      notifications.sort((a, b) => {
        const timeA = a.timestamp || '';
        const timeB = b.timestamp || '';
        return timeB.localeCompare(timeA);
      });
      
      notifications = notifications.slice(0, 20);
      
      const response = sendSuccess(notifications);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
      
    } else if (req.method === 'PUT' || req.method === 'POST') {
      const data = req.body || {};
      const action = data.action || null;
      const notificationId = data.id || null;
      const markAll = data.markAll || false;
      
      const userId = getAuthenticatedUserId(req);
      const role = await getAuthenticatedUserRole(req);
      
      if (!userId) {
        const response = sendError('Unauthorized', 403);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
      
      if (action === 'mark_all_read' || markAll) {
        const allNotifications = await getAllDocuments('notifications');
        let count = 0;
        
        if (role === 'admin') {
          for (const notif of allNotifications) {
            if (notif.userId === 'admin' && !notif.read && notif.id) {
              await updateDocument('notifications', notif.id, { read: true });
              count++;
            }
          }
        } else {
          for (const notif of allNotifications) {
            if (notif.userId === userId && !notif.read && notif.id) {
              await updateDocument('notifications', notif.id, { read: true });
              count++;
            }
          }
        }
        
        const response = sendSuccess({ marked: count }, 'All notifications marked as read');
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
        
      } else if (action === 'mark_read' || notificationId) {
        if (!notificationId) {
          const response = sendError('Notification ID is required', 400);
          res.status(response.statusCode).json(JSON.parse(response.body));
          return;
        }
        await updateDocument('notifications', notificationId, { read: true });
        const response = sendSuccess(null, 'Notification marked as read');
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      } else {
        const response = sendError('Invalid action or missing parameters', 400);
        res.status(response.statusCode).json(JSON.parse(response.body));
        return;
      }
    } else {
      const response = sendError('Method not allowed', 405);
      res.status(response.statusCode).json(JSON.parse(response.body));
      return;
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    const response = sendError('Server error: ' + error.message, 500);
    res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

