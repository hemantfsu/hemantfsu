/**
 * Dashboard Data Aggregator
 * Collects and aggregates data from all modules for the administrative dashboard
 */

// Configuration
const DASHBOARD_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  STUDENT_SHEET_NAME: 'StudentDatabase',
  FEE_SHEET_NAME: 'FeeCollection',
  HOSTEL_SHEET_NAME: 'HostelManagement',
  EXAM_SHEET_NAME: 'ExaminationRecords',
  ACTIVITY_SHEET_NAME: 'AuditLog',
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Cache for dashboard data
let dashboardCache = {
  data: null,
  timestamp: 0
};

/**
 * Get comprehensive dashboard data
 */
function getDashboardData() {
  try {
    // Check if cached data is still valid
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.timestamp) < DASHBOARD_CONFIG.CACHE_DURATION) {
      return dashboardCache.data;
    }
    
    // Collect data from all modules
    const studentStats = getStudentStatistics();
    const financeStats = getFinanceStatistics();
    const hostelStats = getHostelStatistics();
    const examStats = getExaminationStatistics();
    const recentActivities = getRecentActivities();
    const systemHealth = getSystemHealth();
    
    // Aggregate dashboard data
    const dashboardData = {
      timestamp: now,
      students: studentStats,
      finance: financeStats,
      hostel: hostelStats,
      examinations: examStats,
      activities: recentActivities,
      system: systemHealth,
      summary: generateSummary(studentStats, financeStats, hostelStats, examStats)
    };
    
    // Cache the data
    dashboardCache.data = dashboardData;
    dashboardCache.timestamp = now;
    
    Logger.log('Dashboard data aggregated successfully');
    return dashboardData;
    
  } catch (error) {
    Logger.log('Error aggregating dashboard data: ' + error.toString());
    return getDefaultDashboardData();
  }
}

/**
 * Get student statistics
 */
function getStudentStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    const studentSheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.STUDENT_SHEET_NAME);
    
    const data = studentSheet.getDataRange().getValues();
    
    let totalStudents = 0;
    let newApplications = 0;
    let approvedStudents = 0;
    let pendingReviews = 0;
    let rejectedApplications = 0;
    
    const courseDistribution = {};
    const monthlyApplications = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[15]; // Status column
      const course = row[8]; // Course column
      const submissionDate = new Date(row[14]); // Submission date column
      
      totalStudents++;
      
      // Count by status
      switch (status) {
        case 'Pending Review':
          pendingReviews++;
          break;
        case 'Approved':
          approvedStudents++;
          break;
        case 'Rejected':
          rejectedApplications++;
          break;
      }
      
      // Count new applications (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (submissionDate >= thirtyDaysAgo) {
        newApplications++;
      }
      
      // Course distribution
      if (!courseDistribution[course]) {
        courseDistribution[course] = 0;
      }
      courseDistribution[course]++;
      
      // Monthly applications
      const monthKey = submissionDate.getFullYear() + '-' + (submissionDate.getMonth() + 1);
      if (!monthlyApplications[monthKey]) {
        monthlyApplications[monthKey] = 0;
      }
      monthlyApplications[monthKey]++;
    }
    
    return {
      total: totalStudents,
      newApplications: newApplications,
      approved: approvedStudents,
      pending: pendingReviews,
      rejected: rejectedApplications,
      courseDistribution: courseDistribution,
      monthlyApplications: monthlyApplications,
      approvalRate: totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0
    };
    
  } catch (error) {
    Logger.log('Error getting student statistics: ' + error.toString());
    return {
      total: 0,
      newApplications: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      courseDistribution: {},
      monthlyApplications: {},
      approvalRate: 0
    };
  }
}

/**
 * Get finance statistics
 */
function getFinanceStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.FEE_SHEET_NAME);
    
    const data = feeSheet.getDataRange().getValues();
    
    let totalFeeDue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let totalAmount = 0;
    
    const monthlyCollections = {};
    const paymentMethods = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const feeAmount = parseFloat(row[5]) || 0; // Fee amount column
      const paymentStatus = row[6]; // Payment status column
      const paymentDate = row[7]; // Payment date column
      const paymentMethod = row[8]; // Payment method column
      
      totalAmount += feeAmount;
      
      switch (paymentStatus) {
        case 'Paid':
          paidAmount += feeAmount;
          if (paymentDate) {
            const date = new Date(paymentDate);
            const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
            if (!monthlyCollections[monthKey]) {
              monthlyCollections[monthKey] = 0;
            }
            monthlyCollections[monthKey] += feeAmount;
          }
          break;
        case 'Pending':
          pendingAmount += feeAmount;
          break;
        case 'Overdue':
          overdueAmount += feeAmount;
          break;
      }
      
      // Payment methods
      if (paymentMethod && paymentStatus === 'Paid') {
        if (!paymentMethods[paymentMethod]) {
          paymentMethods[paymentMethod] = 0;
        }
        paymentMethods[paymentMethod]++;
      }
    }
    
    totalFeeDue = pendingAmount + overdueAmount;
    
    return {
      totalDue: totalFeeDue,
      paid: paidAmount,
      pending: pendingAmount,
      overdue: overdueAmount,
      totalAmount: totalAmount,
      monthlyCollections: monthlyCollections,
      paymentMethods: paymentMethods,
      collectionRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
    };
    
  } catch (error) {
    Logger.log('Error getting finance statistics: ' + error.toString());
    return {
      totalDue: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      monthlyCollections: {},
      paymentMethods: {},
      collectionRate: 0
    };
  }
}

/**
 * Get hostel statistics
 */
function getHostelStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    const hostelSheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.HOSTEL_SHEET_NAME);
    
    const data = hostelSheet.getDataRange().getValues();
    
    let totalCapacity = 0;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let pendingRequests = 0;
    
    const blockStats = {};
    const roomTypeStats = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const allocationStatus = row[8]; // Allocation status column
      const roomNumber = row[5]; // Room number column
      const hostelType = row[4]; // Hostel type column
      
      // Extract block from room number (assuming format like A101, B201, etc.)
      const block = roomNumber ? roomNumber.charAt(0) : 'Unknown';
      
      if (!blockStats[block]) {
        blockStats[block] = { capacity: 0, occupied: 0, available: 0 };
      }
      
      switch (allocationStatus) {
        case 'Allocated':
        case 'Checked In':
          occupiedRooms++;
          blockStats[block].occupied++;
          break;
        case 'Pending':
          pendingRequests++;
          break;
        case 'Vacated':
          availableRooms++;
          blockStats[block].available++;
          break;
      }
      
      // Room type statistics
      if (!roomTypeStats[hostelType]) {
        roomTypeStats[hostelType] = { total: 0, occupied: 0 };
      }
      roomTypeStats[hostelType].total++;
      if (allocationStatus === 'Allocated' || allocationStatus === 'Checked In') {
        roomTypeStats[hostelType].occupied++;
      }
    }
    
    // Calculate total capacity (this would ideally come from room capacity sheet)
    totalCapacity = occupiedRooms + availableRooms + 100; // Assuming some buffer
    
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedRooms / totalCapacity) * 100) : 0;
    
    return {
      capacity: totalCapacity,
      occupied: occupiedRooms,
      available: availableRooms,
      pendingRequests: pendingRequests,
      occupancyRate: occupancyRate,
      blockStats: blockStats,
      roomTypeStats: roomTypeStats
    };
    
  } catch (error) {
    Logger.log('Error getting hostel statistics: ' + error.toString());
    return {
      capacity: 0,
      occupied: 0,
      available: 0,
      pendingRequests: 0,
      occupancyRate: 0,
      blockStats: {},
      roomTypeStats: {}
    };
  }
}

/**
 * Get examination statistics
 */
function getExaminationStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.EXAM_SHEET_NAME);
    
    const data = examSheet.getDataRange().getValues();
    
    let totalExams = 0;
    let completedExams = 0;
    let pendingExams = 0;
    let totalMarks = 0;
    let totalObtainedMarks = 0;
    
    const courseStats = {};
    const gradeDistribution = {};
    const monthlyExams = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const resultStatus = row[13]; // Result status column
      const marksObtained = parseFloat(row[8]) || 0; // Marks obtained column
      const totalMarksForExam = parseFloat(row[9]) || 0; // Total marks column
      const course = row[3]; // Course column
      const grade = row[10]; // Grade column
      const examDate = row[12]; // Exam date column
      
      totalExams++;
      totalMarks += totalMarksForExam;
      totalObtainedMarks += marksObtained;
      
      switch (resultStatus) {
        case 'Pass':
        case 'Fail':
          completedExams++;
          break;
        case 'Pending':
          pendingExams++;
          break;
      }
      
      // Course statistics
      if (!courseStats[course]) {
        courseStats[course] = { total: 0, passed: 0, failed: 0 };
      }
      courseStats[course].total++;
      if (resultStatus === 'Pass') {
        courseStats[course].passed++;
      } else if (resultStatus === 'Fail') {
        courseStats[course].failed++;
      }
      
      // Grade distribution
      if (grade) {
        if (!gradeDistribution[grade]) {
          gradeDistribution[grade] = 0;
        }
        gradeDistribution[grade]++;
      }
      
      // Monthly exams
      if (examDate) {
        const date = new Date(examDate);
        const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
        if (!monthlyExams[monthKey]) {
          monthlyExams[monthKey] = 0;
        }
        monthlyExams[monthKey]++;
      }
    }
    
    const averageScore = totalMarks > 0 ? Math.round((totalObtainedMarks / totalMarks) * 100) : 0;
    const passRate = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;
    
    return {
      total: totalExams,
      completed: completedExams,
      pending: pendingExams,
      averageScore: averageScore,
      passRate: passRate,
      courseStats: courseStats,
      gradeDistribution: gradeDistribution,
      monthlyExams: monthlyExams
    };
    
  } catch (error) {
    Logger.log('Error getting examination statistics: ' + error.toString());
    return {
      total: 0,
      completed: 0,
      pending: 0,
      averageScore: 0,
      passRate: 0,
      courseStats: {},
      gradeDistribution: {},
      monthlyExams: {}
    };
  }
}

/**
 * Get recent activities
 */
function getRecentActivities() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    const activitySheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.ACTIVITY_SHEET_NAME);
    
    const data = activitySheet.getDataRange().getValues();
    const activities = [];
    
    // Get last 10 activities
    const startIndex = Math.max(1, data.length - 10);
    
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      const action = row[2]; // Action column
      const tableName = row[3]; // Table name column
      const timestamp = row[9]; // Timestamp column
      
      const activity = {
        action: action,
        table: tableName,
        timestamp: timestamp,
        description: generateActivityDescription(action, tableName),
        icon: getActivityIcon(tableName),
        type: getActivityType(tableName)
      };
      
      activities.push(activity);
    }
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return activities.slice(0, 6); // Return last 6 activities
    
  } catch (error) {
    Logger.log('Error getting recent activities: ' + error.toString());
    return [];
  }
}

/**
 * Get system health status
 */
function getSystemHealth() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_CONFIG.SPREADSHEET_ID);
    
    // Check if all required sheets exist
    const requiredSheets = [
      DASHBOARD_CONFIG.STUDENT_SHEET_NAME,
      DASHBOARD_CONFIG.FEE_SHEET_NAME,
      DASHBOARD_CONFIG.HOSTEL_SHEET_NAME,
      DASHBOARD_CONFIG.EXAM_SHEET_NAME
    ];
    
    let healthySheets = 0;
    const sheetStatus = {};
    
    requiredSheets.forEach(sheetName => {
      try {
        const sheet = spreadsheet.getSheetByName(sheetName);
        if (sheet) {
          healthySheets++;
          sheetStatus[sheetName] = 'healthy';
        } else {
          sheetStatus[sheetName] = 'missing';
        }
      } catch (e) {
        sheetStatus[sheetName] = 'error';
      }
    });
    
    const healthScore = Math.round((healthySheets / requiredSheets.length) * 100);
    
    return {
      status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
      score: healthScore,
      sheetStatus: sheetStatus,
      lastBackup: getLastBackupTime(),
      uptime: getSystemUptime()
    };
    
  } catch (error) {
    Logger.log('Error getting system health: ' + error.toString());
    return {
      status: 'critical',
      score: 0,
      sheetStatus: {},
      lastBackup: null,
      uptime: 0
    };
  }
}

/**
 * Generate summary statistics
 */
function generateSummary(studentStats, financeStats, hostelStats, examStats) {
  return {
    totalStudents: studentStats.total,
    totalRevenue: financeStats.paid,
    occupancyRate: hostelStats.occupancyRate,
    passRate: examStats.passRate,
    overallHealth: 'good', // This would be calculated based on all metrics
    keyMetrics: {
      studentGrowth: calculateGrowthRate(studentStats.monthlyApplications),
      revenueGrowth: calculateGrowthRate(financeStats.monthlyCollections),
      academicPerformance: examStats.averageScore
    }
  };
}

/**
 * Utility functions
 */
function generateActivityDescription(action, tableName) {
  const descriptions = {
    'StudentDatabase': 'Student record updated',
    'FeeCollection': 'Fee payment processed',
    'HostelManagement': 'Hostel allocation updated',
    'ExaminationRecords': 'Exam result recorded',
    'UserAccess': 'User access modified',
    'AuditLog': 'System activity logged'
  };
  
  return descriptions[tableName] || `${action} performed on ${tableName}`;
}

function getActivityIcon(tableName) {
  const icons = {
    'StudentDatabase': '🎓',
    'FeeCollection': '💰',
    'HostelManagement': '🏠',
    'ExaminationRecords': '📚',
    'UserAccess': '👤',
    'AuditLog': '📝'
  };
  
  return icons[tableName] || '📋';
}

function getActivityType(tableName) {
  const types = {
    'StudentDatabase': 'student',
    'FeeCollection': 'finance',
    'HostelManagement': 'hostel',
    'ExaminationRecords': 'exam',
    'UserAccess': 'user',
    'AuditLog': 'system'
  };
  
  return types[tableName] || 'general';
}

function calculateGrowthRate(monthlyData) {
  const months = Object.keys(monthlyData).sort();
  if (months.length < 2) return 0;
  
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  
  const current = monthlyData[currentMonth] || 0;
  const previous = monthlyData[previousMonth] || 0;
  
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
}

function getLastBackupTime() {
  // This would typically check a backup log or system configuration
  return new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
}

function getSystemUptime() {
  // This would typically track system uptime
  return Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
}

function getDefaultDashboardData() {
  return {
    timestamp: Date.now(),
    students: { total: 0, newApplications: 0, approved: 0, pending: 0, rejected: 0, courseDistribution: {}, monthlyApplications: {}, approvalRate: 0 },
    finance: { totalDue: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, monthlyCollections: {}, paymentMethods: {}, collectionRate: 0 },
    hostel: { capacity: 0, occupied: 0, available: 0, pendingRequests: 0, occupancyRate: 0, blockStats: {}, roomTypeStats: {} },
    examinations: { total: 0, completed: 0, pending: 0, averageScore: 0, passRate: 0, courseStats: {}, gradeDistribution: {}, monthlyExams: {} },
    activities: [],
    system: { status: 'critical', score: 0, sheetStatus: {}, lastBackup: null, uptime: 0 },
    summary: { totalStudents: 0, totalRevenue: 0, occupancyRate: 0, passRate: 0, overallHealth: 'critical', keyMetrics: { studentGrowth: 0, revenueGrowth: 0, academicPerformance: 0 } }
  };
}

/**
 * Web app endpoint for dashboard data
 */
function doGet(e) {
  try {
    const dashboardData = getDashboardData();
    
    return ContentService
      .createTextOutput(JSON.stringify(dashboardData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'Failed to fetch dashboard data',
        timestamp: Date.now()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Scheduled function to refresh dashboard cache
 */
function refreshDashboardCache() {
  try {
    // Clear cache to force refresh
    dashboardCache.data = null;
    dashboardCache.timestamp = 0;
    
    // Pre-load dashboard data
    getDashboardData();
    
    Logger.log('Dashboard cache refreshed');
    
  } catch (error) {
    Logger.log('Error refreshing dashboard cache: ' + error.toString());
  }
}