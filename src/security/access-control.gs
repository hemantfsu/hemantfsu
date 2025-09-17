/**
 * Security and Access Control System
 * Handles user authentication, authorization, and data protection
 */

// Configuration
const SECURITY_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  USER_ACCESS_SHEET_NAME: 'UserAccess',
  AUDIT_LOG_SHEET_NAME: 'AuditLog',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  ADMIN_EMAIL: 'admin@college.edu',
  SECURITY_EMAIL: 'security@college.edu'
};

// User roles and permissions
const USER_ROLES = {
  ADMIN: {
    name: 'Admin',
    permissions: ['read', 'write', 'delete', 'admin', 'user_management', 'system_config'],
    description: 'Full system access'
  },
  ADMISSIONS: {
    name: 'Admissions',
    permissions: ['read', 'write', 'student_management', 'application_processing'],
    description: 'Student admission management'
  },
  FINANCE: {
    name: 'Finance',
    permissions: ['read', 'write', 'fee_management', 'payment_processing', 'receipt_generation'],
    description: 'Financial operations'
  },
  HOSTEL: {
    name: 'Hostel',
    permissions: ['read', 'write', 'hostel_management', 'room_allocation'],
    description: 'Hostel operations'
  },
  EXAMINATION: {
    name: 'Examination',
    permissions: ['read', 'write', 'exam_management', 'grade_processing', 'transcript_generation'],
    description: 'Examination management'
  },
  FACULTY: {
    name: 'Faculty',
    permissions: ['read', 'write', 'student_records', 'grade_entry'],
    description: 'Academic faculty access'
  },
  STUDENT: {
    name: 'Student',
    permissions: ['read', 'own_data'],
    description: 'Student self-service access'
  }
};

// Session management
let activeSessions = {};

/**
 * Authenticate user login
 */
function authenticateUser(email, password) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const userSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.USER_ACCESS_SHEET_NAME);
    
    // Get user data
    const userData = getUserByEmail(userSheet, email);
    if (!userData) {
      logSecurityEvent('LOGIN_FAILED', 'User not found', { email: email });
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Check if user is active
    if (!userData.isactive) {
      logSecurityEvent('LOGIN_FAILED', 'Inactive user', { email: email, userId: userData.userid });
      return {
        success: false,
        error: 'Account is deactivated'
      };
    }
    
    // Verify password (in real implementation, this would use proper hashing)
    if (!verifyPassword(password, userData.password)) {
      logSecurityEvent('LOGIN_FAILED', 'Invalid password', { email: email, userId: userData.userid });
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Check login attempts
    if (userData.failedattempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      logSecurityEvent('LOGIN_BLOCKED', 'Too many failed attempts', { email: email, userId: userData.userid });
      return {
        success: false,
        error: 'Account locked due to too many failed attempts'
      };
    }
    
    // Create session
    const sessionId = generateSessionId();
    const session = {
      userId: userData.userid,
      email: email,
      role: userData.role,
      permissions: getUserPermissions(userData.role),
      loginTime: new Date(),
      lastActivity: new Date(),
      ipAddress: getClientIP(),
      userAgent: getUserAgent()
    };
    
    activeSessions[sessionId] = session;
    
    // Update user login time and reset failed attempts
    updateUserLogin(userSheet, userData.userid);
    
    // Log successful login
    logSecurityEvent('LOGIN_SUCCESS', 'User logged in', { 
      email: email, 
      userId: userData.userid, 
      sessionId: sessionId 
    });
    
    return {
      success: true,
      sessionId: sessionId,
      user: {
        id: userData.userid,
        email: userData.email,
        fullName: userData.fullname,
        role: userData.role,
        permissions: session.permissions
      }
    };
    
  } catch (error) {
    Logger.log('Error in authentication: ' + error.toString());
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Verify user session
 */
function verifySession(sessionId) {
  try {
    const session = activeSessions[sessionId];
    if (!session) {
      return {
        valid: false,
        error: 'Invalid session'
      };
    }
    
    // Check session timeout
    const now = new Date();
    const timeSinceLastActivity = now - session.lastActivity;
    
    if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
      // Session expired
      delete activeSessions[sessionId];
      logSecurityEvent('SESSION_EXPIRED', 'Session timeout', { 
        userId: session.userId, 
        sessionId: sessionId 
      });
      return {
        valid: false,
        error: 'Session expired'
      };
    }
    
    // Update last activity
    session.lastActivity = now;
    
    return {
      valid: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        permissions: session.permissions
      }
    };
    
  } catch (error) {
    Logger.log('Error verifying session: ' + error.toString());
    return {
      valid: false,
      error: 'Session verification failed'
    };
  }
}

/**
 * Check user permissions
 */
function checkPermission(sessionId, requiredPermission) {
  try {
    const session = verifySession(sessionId);
    if (!session.valid) {
      return {
        allowed: false,
        error: session.error
      };
    }
    
    const userPermissions = session.user.permissions;
    const hasPermission = userPermissions.includes(requiredPermission) || 
                         userPermissions.includes('admin');
    
    if (!hasPermission) {
      logSecurityEvent('PERMISSION_DENIED', 'Access denied', { 
        userId: session.user.id, 
        permission: requiredPermission,
        sessionId: sessionId 
      });
      return {
        allowed: false,
        error: 'Insufficient permissions'
      };
    }
    
    return {
      allowed: true,
      user: session.user
    };
    
  } catch (error) {
    Logger.log('Error checking permission: ' + error.toString());
    return {
      allowed: false,
      error: 'Permission check failed'
    };
  }
}

/**
 * Logout user
 */
function logoutUser(sessionId) {
  try {
    const session = activeSessions[sessionId];
    if (session) {
      logSecurityEvent('LOGOUT', 'User logged out', { 
        userId: session.userId, 
        sessionId: sessionId 
      });
      delete activeSessions[sessionId];
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
    
  } catch (error) {
    Logger.log('Error logging out: ' + error.toString());
    return {
      success: false,
      error: 'Logout failed'
    };
  }
}

/**
 * Create new user account
 */
function createUser(userData, createdBySessionId) {
  try {
    // Check if creator has admin permissions
    const permissionCheck = checkPermission(createdBySessionId, 'user_management');
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.error
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const userSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.USER_ACCESS_SHEET_NAME);
    
    // Validate user data
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }
    
    // Check if user already exists
    const existingUser = getUserByEmail(userSheet, userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }
    
    // Generate user ID
    const userId = 'USR' + Date.now();
    
    // Hash password
    const hashedPassword = hashPassword(userData.password);
    
    // Create user record
    const newUser = [
      userId,
      userData.email,
      userData.fullName,
      userData.role,
      userData.department || '',
      JSON.stringify(getUserPermissions(userData.role)),
      true, // IsActive
      null, // LastLogin
      new Date(), // CreatedAt
      new Date(), // UpdatedAt
      0, // FailedAttempts
      hashedPassword // Password (hashed)
    ];
    
    userSheet.appendRow(newUser);
    
    // Log user creation
    logSecurityEvent('USER_CREATED', 'New user created', { 
      userId: userId, 
      email: userData.email, 
      role: userData.role,
      createdBy: permissionCheck.user.id 
    });
    
    return {
      success: true,
      userId: userId,
      message: 'User created successfully'
    };
    
  } catch (error) {
    Logger.log('Error creating user: ' + error.toString());
    return {
      success: false,
      error: 'User creation failed'
    };
  }
}

/**
 * Update user permissions
 */
function updateUserPermissions(userId, newRole, updatedBySessionId) {
  try {
    // Check if updater has admin permissions
    const permissionCheck = checkPermission(updatedBySessionId, 'user_management');
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.error
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const userSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.USER_ACCESS_SHEET_NAME);
    
    // Get user data
    const userData = getUserById(userSheet, userId);
    if (!userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Update user role and permissions
    const data = userSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        const roleColumn = headers.indexOf('Role') + 1;
        const permissionsColumn = headers.indexOf('Permissions') + 1;
        const updatedAtColumn = headers.indexOf('UpdatedAt') + 1;
        
        userSheet.getRange(i + 1, roleColumn).setValue(newRole);
        userSheet.getRange(i + 1, permissionsColumn).setValue(JSON.stringify(getUserPermissions(newRole)));
        userSheet.getRange(i + 1, updatedAtColumn).setValue(new Date());
        
        break;
      }
    }
    
    // Log permission update
    logSecurityEvent('PERMISSIONS_UPDATED', 'User permissions updated', { 
      userId: userId, 
      oldRole: userData.role,
      newRole: newRole,
      updatedBy: permissionCheck.user.id 
    });
    
    return {
      success: true,
      message: 'User permissions updated successfully'
    };
    
  } catch (error) {
    Logger.log('Error updating user permissions: ' + error.toString());
    return {
      success: false,
      error: 'Permission update failed'
    };
  }
}

/**
 * Deactivate user account
 */
function deactivateUser(userId, deactivatedBySessionId) {
  try {
    // Check if deactivator has admin permissions
    const permissionCheck = checkPermission(deactivatedBySessionId, 'user_management');
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.error
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const userSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.USER_ACCESS_SHEET_NAME);
    
    // Get user data
    const userData = getUserById(userSheet, userId);
    if (!userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Deactivate user
    const data = userSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        const isActiveColumn = headers.indexOf('IsActive') + 1;
        const updatedAtColumn = headers.indexOf('UpdatedAt') + 1;
        
        userSheet.getRange(i + 1, isActiveColumn).setValue(false);
        userSheet.getRange(i + 1, updatedAtColumn).setValue(new Date());
        
        break;
      }
    }
    
    // Log user deactivation
    logSecurityEvent('USER_DEACTIVATED', 'User account deactivated', { 
      userId: userId, 
      email: userData.email,
      deactivatedBy: permissionCheck.user.id 
    });
    
    return {
      success: true,
      message: 'User account deactivated successfully'
    };
    
  } catch (error) {
    Logger.log('Error deactivating user: ' + error.toString());
    return {
      success: false,
      error: 'User deactivation failed'
    };
  }
}

/**
 * Get security audit log
 */
function getSecurityAuditLog(sessionId, filters = {}) {
  try {
    // Check if user has admin permissions
    const permissionCheck = checkPermission(sessionId, 'admin');
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.error
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const auditSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.AUDIT_LOG_SHEET_NAME);
    
    const data = auditSheet.getDataRange().getValues();
    const headers = data[0];
    let auditLogs = [];
    
    // Filter audit logs
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const logEntry = {};
      
      headers.forEach((header, index) => {
        logEntry[header.toLowerCase().replace(/\s+/g, '')] = row[index];
      });
      
      // Apply filters
      let includeLog = true;
      
      if (filters.action && logEntry.action !== filters.action) {
        includeLog = false;
      }
      
      if (filters.userId && logEntry.userid !== filters.userId) {
        includeLog = false;
      }
      
      if (filters.startDate && new Date(logEntry.timestamp) < new Date(filters.startDate)) {
        includeLog = false;
      }
      
      if (filters.endDate && new Date(logEntry.timestamp) > new Date(filters.endDate)) {
        includeLog = false;
      }
      
      if (includeLog) {
        auditLogs.push(logEntry);
      }
    }
    
    // Sort by timestamp (most recent first)
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    if (filters.limit) {
      auditLogs = auditLogs.slice(0, filters.limit);
    }
    
    return {
      success: true,
      logs: auditLogs,
      total: auditLogs.length
    };
    
  } catch (error) {
    Logger.log('Error getting security audit log: ' + error.toString());
    return {
      success: false,
      error: 'Failed to retrieve audit log'
    };
  }
}

/**
 * Utility functions
 */
function getUserByEmail(userSheet, email) {
  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) { // Email is in column 2
      const userData = {};
      headers.forEach((header, index) => {
        userData[header.toLowerCase().replace(/\s+/g, '')] = data[i][index];
      });
      return userData;
    }
  }
  return null;
}

function getUserById(userSheet, userId) {
  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) { // User ID is in column 1
      const userData = {};
      headers.forEach((header, index) => {
        userData[header.toLowerCase().replace(/\s+/g, '')] = data[i][index];
      });
      return userData;
    }
  }
  return null;
}

function getUserPermissions(role) {
  const roleConfig = USER_ROLES[role.toUpperCase()];
  return roleConfig ? roleConfig.permissions : [];
}

function validateUserData(userData) {
  if (!userData.email || !userData.email.includes('@')) {
    return { isValid: false, error: 'Valid email is required' };
  }
  
  if (!userData.password || userData.password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters` };
  }
  
  if (!userData.fullName || userData.fullName.trim().length < 2) {
    return { isValid: false, error: 'Full name is required' };
  }
  
  if (!userData.role || !USER_ROLES[userData.role.toUpperCase()]) {
    return { isValid: false, error: 'Valid role is required' };
  }
  
  return { isValid: true };
}

function hashPassword(password) {
  // In a real implementation, use proper password hashing like bcrypt
  // This is a simplified version for demonstration
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, password).toString();
}

function verifyPassword(password, hashedPassword) {
  // In a real implementation, use proper password verification
  return hashPassword(password) === hashedPassword;
}

function generateSessionId() {
  return 'SES' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function getClientIP() {
  // In Google Apps Script, this would be available from the request
  return '127.0.0.1'; // Placeholder
}

function getUserAgent() {
  // In Google Apps Script, this would be available from the request
  return 'Google Apps Script'; // Placeholder
}

function updateUserLogin(userSheet, userId) {
  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const lastLoginColumn = headers.indexOf('LastLogin') + 1;
      const failedAttemptsColumn = headers.indexOf('FailedAttempts') + 1;
      
      userSheet.getRange(i + 1, lastLoginColumn).setValue(new Date());
      userSheet.getRange(i + 1, failedAttemptsColumn).setValue(0);
      break;
    }
  }
}

function logSecurityEvent(action, description, details = {}) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SECURITY_CONFIG.SPREADSHEET_ID);
    const auditSheet = spreadsheet.getSheetByName(SECURITY_CONFIG.AUDIT_LOG_SHEET_NAME);
    
    const logEntry = [
      'LOG' + Date.now(),
      details.userId || 'SYSTEM',
      action,
      'Security',
      details.sessionId || '',
      '', // Old values
      JSON.stringify(details),
      getClientIP(),
      getUserAgent(),
      new Date()
    ];
    
    auditSheet.appendRow(logEntry);
    
  } catch (error) {
    Logger.log('Error logging security event: ' + error.toString());
  }
}

/**
 * Web app endpoints for security
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'login':
        const loginResult = authenticateUser(data.email, data.password);
        return ContentService
          .createTextOutput(JSON.stringify(loginResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'logout':
        const logoutResult = logoutUser(data.sessionId);
        return ContentService
          .createTextOutput(JSON.stringify(logoutResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'verifySession':
        const verifyResult = verifySession(data.sessionId);
        return ContentService
          .createTextOutput(JSON.stringify(verifyResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'checkPermission':
        const permissionResult = checkPermission(data.sessionId, data.permission);
        return ContentService
          .createTextOutput(JSON.stringify(permissionResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'createUser':
        const createResult = createUser(data.userData, data.sessionId);
        return ContentService
          .createTextOutput(JSON.stringify(createResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'updatePermissions':
        const updateResult = updateUserPermissions(data.userId, data.newRole, data.sessionId);
        return ContentService
          .createTextOutput(JSON.stringify(updateResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'deactivateUser':
        const deactivateResult = deactivateUser(data.userId, data.sessionId);
        return ContentService
          .createTextOutput(JSON.stringify(deactivateResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'getAuditLog':
        const auditResult = getSecurityAuditLog(data.sessionId, data.filters);
        return ContentService
          .createTextOutput(JSON.stringify(auditResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    Logger.log('Error in security doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Scheduled function to clean up expired sessions
 */
function cleanupExpiredSessions() {
  try {
    const now = new Date();
    const expiredSessions = [];
    
    Object.keys(activeSessions).forEach(sessionId => {
      const session = activeSessions[sessionId];
      const timeSinceLastActivity = now - session.lastActivity;
      
      if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      delete activeSessions[sessionId];
      logSecurityEvent('SESSION_CLEANUP', 'Expired session cleaned up', { sessionId: sessionId });
    });
    
    Logger.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    
  } catch (error) {
    Logger.log('Error cleaning up sessions: ' + error.toString());
  }
}