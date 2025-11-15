/**
 * API Client for PHP Backend
 * Handles all API communication
 */

// API Base URL - works for both local and Vercel deployment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'api/' 
  : '/api/';

async function apiRequest(endpoint, options = {}) {
  try {
    const url = API_BASE + endpoint;
    
    // Determine which page we're on to use the correct userId
    const currentPath = window.location.href;
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop();
    const pageTitle = document.title.toLowerCase();
    
    const isAdminPage = currentPath.includes('admin_dboard') || 
                        currentPath.includes('admin_dashboard') ||
                        filename === 'admin_dboard.html' ||
                        filename === 'admin_dashboard.html' ||
                        pageTitle.includes('admin');
    
    const isBorrowerPage = currentPath.includes('borrower_dashboard') ||
                           filename === 'borrower_dashboard.html' ||
                           pageTitle.includes('borrower');
    
    // Get the appropriate userId based on the page
    const adminId = localStorage.getItem('adminId');
    const borrowerId = localStorage.getItem('borrowerId');
    
    let userId;
    if (isAdminPage) {
      userId = adminId || borrowerId; // Prioritize adminId on admin pages
      if (!adminId && borrowerId) {
        console.warn('[API] Admin page detected but using borrowerId. This may cause authorization issues.');
      }
    } else if (isBorrowerPage) {
      userId = borrowerId || adminId; // Prioritize borrowerId on borrower pages
      if (!borrowerId && adminId) {
        console.warn('[API] Borrower page detected but using adminId. This may cause authorization issues.');
      }
    } else {
      // Fallback: try adminId first, then borrowerId
      userId = adminId || borrowerId;
    }
    
    // Log the request for debugging
    console.log('[API Request]', {
      url,
      method: options.method || 'GET',
      endpoint,
      isAdminPage,
      isBorrowerPage,
      adminId,
      borrowerId,
      selectedUserId: userId,
      currentPath: pathname
    });
    
    const defaultOptions = {
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '', // Pass userId in header for authentication
        ...options.headers
      },
      mode: 'cors', // Explicitly set CORS mode
      cache: 'no-cache' // Prevent caching issues
    };
    
    // Ensure method is explicitly set (override any PUT/DELETE)
    const method = options.method || 'GET';
    if (method === 'PUT' || method === 'DELETE') {
      console.warn('[API] PUT/DELETE method detected, this may fail on InfinityFree. Consider using POST with action parameter.');
    }
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      method: method, // Explicitly set method
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    // Clone the response so we can read it multiple times if needed
    const responseClone = response.clone();
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, get text response from the clone for debugging
        try {
          const text = await responseClone.text();
          console.error('JSON parse error:', jsonError);
          console.error('Response text:', text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
        } catch (textError) {
          // If we can't read text either, just throw the original JSON error
          console.error('JSON parse error:', jsonError);
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
      }
    } else {
      // If not JSON, get text response for debugging
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error(`API returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
    }
    
    if (!response.ok || !data.success) {
      const errorMsg = data.error || `API request failed (HTTP ${response.status})`;
      console.error('API Error Details:', {
        status: response.status,
        error: errorMsg,
        fullResponse: data
      });
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Equipment API
const EquipmentAPI = {
  async getAll() {
    const response = await apiRequest('equipment');
    return response.data;
  },
  
  async getById(id) {
    const response = await apiRequest(`equipment?id=${id}`);
    return response.data;
  },
  
  async create(data) {
    const response = await apiRequest('equipment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },
  
  async update(id, data) {
    // Use POST with action=update instead of PUT (InfinityFree blocks PUT on free plans)
    const response = await apiRequest('equipment', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'update', ...data })
    });
    return response.data;
  },
  
  async delete(id) {
    // Use POST with action=delete instead of DELETE (InfinityFree blocks DELETE on free plans)
    const response = await apiRequest('equipment', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'delete' })
    });
    return response.data;
  }
};

// Requests API
const RequestsAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.borrowerId) params.append('borrowerId', filters.borrowerId);
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = queryString ? `requests?${queryString}` : 'requests';
    const response = await apiRequest(url);
    return response.data;
  },
  
  async getById(id) {
    const response = await apiRequest(`requests?id=${id}`);
    return response.data;
  },
  
  async create(data) {
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },
  
  async approve(id, adminComment = null) {
    // Use POST instead of PUT (InfinityFree blocks PUT/DELETE on free plans)
    console.log('[API] Approve request:', { id, adminComment, method: 'POST' });
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'approve', adminComment })
    });
    return response.data;
  },
  
  async reject(id, adminComment = null) {
    // Use POST instead of PUT
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'reject', adminComment })
    });
    return response.data;
  },
  
  async return(id, returnCondition, returnNotes = null) {
    // Use POST instead of PUT
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'return', returnCondition, returnNotes })
    });
    return response.data;
  },
  
  async cancel(id, cancellationComment) {
    // Use POST instead of PUT
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'cancel', cancellationComment })
    });
    return response.data;
  },
  
  async submitReview(id, reviewData) {
    // Submit review for a returned request
    const response = await apiRequest('requests', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'review', review: reviewData })
    });
    return response.data;
  }
};

// Dashboard API
const DashboardAPI = {
  async getStats() {
    const response = await apiRequest('dashboard?type=stats');
    return response.data;
  },
  
  async getRecentActivity() {
    const response = await apiRequest('dashboard?type=recent_activity');
    return response.data;
  },
  
  async getChartData() {
    const response = await apiRequest('dashboard?type=chart_data');
    return response.data;
  }
};

// Borrowers API
const BorrowersAPI = {
  async getAll(search = null) {
    const url = search ? `borrowers?search=${encodeURIComponent(search)}` : 'borrowers';
    const response = await apiRequest(url);
    return response.data;
  },
  
  async getById(id) {
    const response = await apiRequest(`borrowers?id=${id}`);
    return response.data;
  }
};

// Notifications API
const NotificationsAPI = {
  async getAll() {
    const response = await apiRequest('notifications');
    return response.data;
  },
  
  async markAsRead(id) {
    // Use POST with action instead of PUT (InfinityFree blocks PUT)
    const response = await apiRequest('notifications', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'mark_read' })
    });
    return response.data;
  },
  
  async markAllAsRead() {
    // Use POST with action instead of PUT
    const response = await apiRequest('notifications', {
      method: 'POST',
      body: JSON.stringify({ action: 'mark_all_read' })
    });
    return response.data;
  }
};

// History API
const HistoryAPI = {
  async getEquipmentHistory(equipmentId) {
    const response = await apiRequest(`history?equipmentId=${equipmentId}`);
    return response.data;
  }
};

// Auth API
const AuthAPI = {
  async login(userId, password) {
    const response = await apiRequest('auth', {
      method: 'POST',
      body: JSON.stringify({ userId, password })
    });
    return response.data;
  },
  
  async checkAuth() {
    const response = await apiRequest('auth');
    return response.data;
  },
  
  async logout() {
    await apiRequest('auth', { method: 'DELETE' });
  }
};

// Export API
const ExportAPI = {
  async exportData(type, format = 'csv', filters = {}) {
    // Use POST method with filters in body for better compatibility
    const response = await fetch(API_BASE + 'export', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('adminId') || localStorage.getItem('borrowerId') || ''
      },
      body: JSON.stringify({
        type,
        format,
        filters
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Export failed: ' + errorText);
    }
    
    // Get filename from Content-Disposition header or generate one
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `${type}_${new Date().toISOString().split('T')[0]}.${format}`;
    if (contentDisposition) {
      const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
      if (matches) filename = matches[1];
    }
    
    // Download the file
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
  }
};

// Bulk Operations API
const BulkOperationsAPI = {
  async bulkUpdateEquipmentStatus(ids, status) {
    const response = await apiRequest('bulk_operations', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'update_equipment_status',
        ids,
        updateData: { status }
      })
    });
    return response.data;
  },
  
  async bulkUpdateEquipmentCondition(ids, condition) {
    const response = await apiRequest('bulk_operations', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'update_equipment_condition',
        ids,
        updateData: { condition }
      })
    });
    return response.data;
  },
  
  async bulkApproveRequests(ids) {
    const response = await apiRequest('bulk_operations', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'approve_requests',
        ids
      })
    });
    return response.data;
  },
  
  async bulkRejectRequests(ids, adminComment = 'Bulk rejection') {
    const response = await apiRequest('bulk_operations', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'reject_requests',
        ids,
        adminComment
      })
    });
    return response.data;
  },
  
  async bulkDeleteEquipment(ids) {
    const response = await apiRequest('bulk_operations', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'delete_equipment',
        ids
      })
    });
    return response.data;
  }
};

// Export to window
window.EquipmentAPI = EquipmentAPI;
window.RequestsAPI = RequestsAPI;
window.DashboardAPI = DashboardAPI;
window.BorrowersAPI = BorrowersAPI;
window.NotificationsAPI = NotificationsAPI;
window.HistoryAPI = HistoryAPI;
window.AuthAPI = AuthAPI;
window.ExportAPI = ExportAPI;
window.BulkOperationsAPI = BulkOperationsAPI;

