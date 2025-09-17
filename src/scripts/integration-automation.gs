/**
 * Integration and Automation Scripts
 * Handles cross-platform integrations and automated workflows
 */

// Configuration
const INTEGRATION_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  WEBHOOK_URLS: {
    SLACK: 'YOUR_SLACK_WEBHOOK_URL',
    TEAMS: 'YOUR_TEAMS_WEBHOOK_URL',
    DISCORD: 'YOUR_DISCORD_WEBHOOK_URL'
  },
  EMAIL_TEMPLATES: {
    ADMISSION_CONFIRMATION: 'YOUR_ADMISSION_TEMPLATE_ID',
    FEE_RECEIPT: 'YOUR_RECEIPT_TEMPLATE_ID',
    EXAM_RESULT: 'YOUR_EXAM_TEMPLATE_ID',
    HOSTEL_ALLOCATION: 'YOUR_HOSTEL_TEMPLATE_ID'
  },
  BACKUP_CONFIG: {
    DRIVE_FOLDER_ID: 'YOUR_BACKUP_FOLDER_ID',
    BACKUP_FREQUENCY: 'daily', // daily, weekly, monthly
    RETENTION_DAYS: 30
  }
};

/**
 * Main automation orchestrator
 */
function runAutomationWorkflows() {
  try {
    Logger.log('Starting automation workflows...');
    
    // Run daily workflows
    runDailyWorkflows();
    
    // Run weekly workflows (if it's Monday)
    const today = new Date();
    if (today.getDay() === 1) { // Monday
      runWeeklyWorkflows();
    }
    
    // Run monthly workflows (if it's the first day of the month)
    if (today.getDate() === 1) {
      runMonthlyWorkflows();
    }
    
    Logger.log('Automation workflows completed successfully');
    
  } catch (error) {
    Logger.log('Error in automation workflows: ' + error.toString());
    sendErrorNotification('Automation Workflow Error', error.toString());
  }
}

/**
 * Daily automation workflows
 */
function runDailyWorkflows() {
  try {
    Logger.log('Running daily workflows...');
    
    // 1. Check for overdue payments
    checkOverduePayments();
    
    // 2. Send payment reminders
    sendPaymentReminders();
    
    // 3. Update hostel occupancy
    updateHostelOccupancy();
    
    // 4. Process pending applications
    processPendingApplications();
    
    // 5. Generate daily reports
    generateDailyReports();
    
    // 6. Clean up expired sessions
    cleanupExpiredSessions();
    
    // 7. Backup critical data
    backupCriticalData();
    
    Logger.log('Daily workflows completed');
    
  } catch (error) {
    Logger.log('Error in daily workflows: ' + error.toString());
  }
}

/**
 * Weekly automation workflows
 */
function runWeeklyWorkflows() {
  try {
    Logger.log('Running weekly workflows...');
    
    // 1. Generate weekly reports
    generateWeeklyReports();
    
    // 2. Update system statistics
    updateSystemStatistics();
    
    // 3. Clean up old audit logs
    cleanupOldAuditLogs();
    
    // 4. Send weekly summary to admin
    sendWeeklySummary();
    
    Logger.log('Weekly workflows completed');
    
  } catch (error) {
    Logger.log('Error in weekly workflows: ' + error.toString());
  }
}

/**
 * Monthly automation workflows
 */
function runMonthlyWorkflows() {
  try {
    Logger.log('Running monthly workflows...');
    
    // 1. Generate monthly reports
    generateMonthlyReports();
    
    // 2. Archive old data
    archiveOldData();
    
    // 3. Update fee structures
    updateFeeStructures();
    
    // 4. Generate institutional reports
    generateInstitutionalReports();
    
    // 5. Send monthly summary to stakeholders
    sendMonthlySummary();
    
    Logger.log('Monthly workflows completed');
    
  } catch (error) {
    Logger.log('Error in monthly workflows: ' + error.toString());
  }
}

/**
 * Check for overdue payments and send notifications
 */
function checkOverduePayments() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName('FeeCollection');
    
    const data = feeSheet.getDataRange().getValues();
    const today = new Date();
    const overdueStudents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const paymentStatus = row[6]; // Payment status column
      const dueDate = new Date(row[11]); // Due date column
      const studentId = row[1]; // Student ID column
      const amount = row[5]; // Fee amount column
      
      if (paymentStatus === 'Pending' && dueDate < today) {
        overdueStudents.push({
          studentId: studentId,
          amount: amount,
          daysOverdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // Send notifications for overdue payments
    if (overdueStudents.length > 0) {
      sendOverduePaymentNotifications(overdueStudents);
      notifyAdminOverduePayments(overdueStudents);
    }
    
    Logger.log(`Checked overdue payments: ${overdueStudents.length} students overdue`);
    
  } catch (error) {
    Logger.log('Error checking overdue payments: ' + error.toString());
  }
}

/**
 * Send payment reminders
 */
function sendPaymentReminders() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName('FeeCollection');
    const studentSheet = spreadsheet.getSheetByName('StudentDatabase');
    
    const data = feeSheet.getDataRange().getValues();
    const today = new Date();
    const reminderStudents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const paymentStatus = row[6]; // Payment status column
      const dueDate = new Date(row[11]); // Due date column
      const studentId = row[1]; // Student ID column
      
      if (paymentStatus === 'Pending') {
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        
        // Send reminder 7 days before due date
        if (daysUntilDue === 7) {
          reminderStudents.push({
            studentId: studentId,
            dueDate: dueDate,
            daysUntilDue: daysUntilDue
          });
        }
      }
    }
    
    // Send payment reminders
    reminderStudents.forEach(student => {
      sendPaymentReminder(student);
    });
    
    Logger.log(`Sent payment reminders to ${reminderStudents.length} students`);
    
  } catch (error) {
    Logger.log('Error sending payment reminders: ' + error.toString());
  }
}

/**
 * Update hostel occupancy statistics
 */
function updateHostelOccupancy() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const hostelSheet = spreadsheet.getSheetByName('HostelManagement');
    const capacitySheet = spreadsheet.getSheetByName('RoomCapacity');
    
    // Get current occupancy data
    const hostelData = hostelSheet.getDataRange().getValues();
    const capacityData = capacitySheet.getDataRange().getValues();
    
    // Update room capacity sheet with current occupancy
    for (let i = 1; i < capacityData.length; i++) {
      const roomNumber = capacityData[i][1]; // Room number column
      let occupied = 0;
      
      // Count occupied rooms
      for (let j = 1; j < hostelData.length; j++) {
        if (hostelData[j][5] === roomNumber && 
            (hostelData[j][8] === 'Allocated' || hostelData[j][8] === 'Checked In')) {
          occupied++;
        }
      }
      
      // Update occupancy count
      const available = capacityData[i][3] - occupied; // Capacity - Occupied
      capacitySheet.getRange(i + 1, 5).setValue(occupied); // Occupied column
      capacitySheet.getRange(i + 1, 6).setValue(available); // Available column
      capacitySheet.getRange(i + 1, 10).setValue(available > 0 ? 'Available' : 'Full'); // Status column
      capacitySheet.getRange(i + 1, 11).setValue(new Date()); // Last updated column
    }
    
    Logger.log('Hostel occupancy updated successfully');
    
  } catch (error) {
    Logger.log('Error updating hostel occupancy: ' + error.toString());
  }
}

/**
 * Process pending applications
 */
function processPendingApplications() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const studentSheet = spreadsheet.getSheetByName('StudentDatabase');
    
    const data = studentSheet.getDataRange().getValues();
    const pendingApplications = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[15]; // Status column
      const submissionDate = new Date(row[14]); // Submission date column
      const studentId = row[0]; // Student ID column
      
      if (status === 'Pending Review') {
        const daysSinceSubmission = Math.floor((new Date() - submissionDate) / (1000 * 60 * 60 * 24));
        
        // Flag applications pending for more than 5 days
        if (daysSinceSubmission > 5) {
          pendingApplications.push({
            studentId: studentId,
            daysSinceSubmission: daysSinceSubmission
          });
        }
      }
    }
    
    // Notify admin about pending applications
    if (pendingApplications.length > 0) {
      notifyAdminPendingApplications(pendingApplications);
    }
    
    Logger.log(`Found ${pendingApplications.length} applications pending review`);
    
  } catch (error) {
    Logger.log('Error processing pending applications: ' + error.toString());
  }
}

/**
 * Generate daily reports
 */
function generateDailyReports() {
  try {
    const reportData = {
      date: new Date().toLocaleDateString(),
      newApplications: getNewApplicationsCount(),
      paymentsReceived: getPaymentsReceivedCount(),
      hostelOccupancy: getHostelOccupancyRate(),
      examResults: getExamResultsCount(),
      systemHealth: getSystemHealthStatus()
    };
    
    // Send daily report to admin
    sendDailyReport(reportData);
    
    // Update dashboard cache
    refreshDashboardCache();
    
    Logger.log('Daily reports generated successfully');
    
  } catch (error) {
    Logger.log('Error generating daily reports: ' + error.toString());
  }
}

/**
 * Generate weekly reports
 */
function generateWeeklyReports() {
  try {
    const reportData = {
      week: getWeekNumber(),
      totalApplications: getWeeklyApplicationsCount(),
      totalRevenue: getWeeklyRevenue(),
      averageOccupancy: getWeeklyAverageOccupancy(),
      examPassRate: getWeeklyExamPassRate(),
      systemUptime: getSystemUptime()
    };
    
    // Send weekly report to stakeholders
    sendWeeklyReport(reportData);
    
    Logger.log('Weekly reports generated successfully');
    
  } catch (error) {
    Logger.log('Error generating weekly reports: ' + error.toString());
  }
}

/**
 * Generate monthly reports
 */
function generateMonthlyReports() {
  try {
    const reportData = {
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalStudents: getMonthlyStudentCount(),
      totalRevenue: getMonthlyRevenue(),
      averageOccupancy: getMonthlyAverageOccupancy(),
      examStatistics: getMonthlyExamStatistics(),
      systemPerformance: getSystemPerformanceMetrics()
    };
    
    // Send monthly report to management
    sendMonthlyReport(reportData);
    
    Logger.log('Monthly reports generated successfully');
    
  } catch (error) {
    Logger.log('Error generating monthly reports: ' + error.toString());
  }
}

/**
 * Archive old data
 */
function archiveOldData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const auditSheet = spreadsheet.getSheetByName('AuditLog');
    
    const data = auditSheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Archive data older than 6 months
    
    const rowsToArchive = [];
    
    for (let i = 1; i < data.length; i++) {
      const timestamp = new Date(data[i][9]); // Timestamp column
      if (timestamp < cutoffDate) {
        rowsToArchive.push(i + 1); // Row number (1-indexed)
      }
    }
    
    // Archive old audit logs (move to separate sheet or delete)
    if (rowsToArchive.length > 0) {
      archiveAuditLogs(rowsToArchive);
    }
    
    Logger.log(`Archived ${rowsToArchive.length} old audit log entries`);
    
  } catch (error) {
    Logger.log('Error archiving old data: ' + error.toString());
  }
}

/**
 * Backup critical data
 */
function backupCriticalData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const backupFolder = DriveApp.getFolderById(INTEGRATION_CONFIG.BACKUP_CONFIG.DRIVE_FOLDER_ID);
    
    // Create backup filename with timestamp
    const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd_HH-mm-ss');
    const backupFilename = `ERP_Backup_${timestamp}.xlsx`;
    
    // Create backup
    const backupFile = DriveApp.getFileById(spreadsheet.getId()).makeCopy(backupFilename, backupFolder);
    
    // Log backup creation
    logBackupActivity(backupFilename, backupFile.getId());
    
    // Clean up old backups
    cleanupOldBackups();
    
    Logger.log(`Backup created: ${backupFilename}`);
    
  } catch (error) {
    Logger.log('Error creating backup: ' + error.toString());
  }
}

/**
 * Send notifications via various channels
 */
function sendSlackNotification(message, channel = '#erp-notifications') {
  try {
    const payload = {
      text: message,
      channel: channel,
      username: 'ERP Bot',
      icon_emoji: ':robot_face:'
    };
    
    const response = UrlFetchApp.fetch(INTEGRATION_CONFIG.WEBHOOK_URLS.SLACK, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    Logger.log('Slack notification sent successfully');
    
  } catch (error) {
    Logger.log('Error sending Slack notification: ' + error.toString());
  }
}

function sendTeamsNotification(message, title = 'ERP Notification') {
  try {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '0076D7',
      summary: title,
      sections: [{
        activityTitle: title,
        activitySubtitle: new Date().toLocaleString(),
        text: message
      }]
    };
    
    const response = UrlFetchApp.fetch(INTEGRATION_CONFIG.WEBHOOK_URLS.TEAMS, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    Logger.log('Teams notification sent successfully');
    
  } catch (error) {
    Logger.log('Error sending Teams notification: ' + error.toString());
  }
}

function sendDiscordNotification(message, title = 'ERP Notification') {
  try {
    const payload = {
      embeds: [{
        title: title,
        description: message,
        color: 3447003,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Educational Institution ERP'
        }
      }]
    };
    
    const response = UrlFetchApp.fetch(INTEGRATION_CONFIG.WEBHOOK_URLS.DISCORD, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    Logger.log('Discord notification sent successfully');
    
  } catch (error) {
    Logger.log('Error sending Discord notification: ' + error.toString());
  }
}

/**
 * Send email notifications
 */
function sendEmailNotification(to, subject, body, attachments = []) {
  try {
    GmailApp.sendEmail(to, subject, body, {
      attachments: attachments,
      name: 'Educational Institution ERP'
    });
    
    Logger.log(`Email sent to ${to}: ${subject}`);
    
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
  }
}

function sendErrorNotification(title, errorMessage) {
  try {
    const subject = `ERP System Error: ${title}`;
    const body = `
An error occurred in the ERP system:

Title: ${title}
Error: ${errorMessage}
Time: ${new Date().toLocaleString()}

Please check the system logs for more details.

This is an automated message from the ERP system.
    `;
    
    sendEmailNotification(INTEGRATION_CONFIG.ADMIN_EMAIL, subject, body);
    
    // Also send to Slack/Teams if configured
    if (INTEGRATION_CONFIG.WEBHOOK_URLS.SLACK) {
      sendSlackNotification(`🚨 ERP Error: ${title}\n${errorMessage}`);
    }
    
  } catch (error) {
    Logger.log('Error sending error notification: ' + error.toString());
  }
}

/**
 * Utility functions for data collection
 */
function getNewApplicationsCount() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const studentSheet = spreadsheet.getSheetByName('StudentDatabase');
    
    const data = studentSheet.getDataRange().getValues();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const submissionDate = new Date(data[i][14]); // Submission date column
      if (submissionDate >= yesterday && submissionDate < today) {
        count++;
      }
    }
    
    return count;
    
  } catch (error) {
    Logger.log('Error getting new applications count: ' + error.toString());
    return 0;
  }
}

function getPaymentsReceivedCount() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName('FeeCollection');
    
    const data = feeSheet.getDataRange().getValues();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const paymentDate = new Date(data[i][7]); // Payment date column
      if (paymentDate >= yesterday && paymentDate < today && data[i][6] === 'Paid') {
        count++;
      }
    }
    
    return count;
    
  } catch (error) {
    Logger.log('Error getting payments received count: ' + error.toString());
    return 0;
  }
}

function getHostelOccupancyRate() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const capacitySheet = spreadsheet.getSheetByName('RoomCapacity');
    
    const data = capacitySheet.getDataRange().getValues();
    let totalCapacity = 0;
    let totalOccupied = 0;
    
    for (let i = 1; i < data.length; i++) {
      totalCapacity += data[i][3]; // Capacity column
      totalOccupied += data[i][4]; // Occupied column
    }
    
    return totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    
  } catch (error) {
    Logger.log('Error getting hostel occupancy rate: ' + error.toString());
    return 0;
  }
}

function getExamResultsCount() {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName('ExaminationRecords');
    
    const data = examSheet.getDataRange().getValues();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      const examDate = new Date(data[i][12]); // Exam date column
      if (examDate >= yesterday && examDate < today) {
        count++;
      }
    }
    
    return count;
    
  } catch (error) {
    Logger.log('Error getting exam results count: ' + error.toString());
    return 0;
  }
}

function getSystemHealthStatus() {
  try {
    // This would check various system health indicators
    return 'Healthy';
    
  } catch (error) {
    Logger.log('Error getting system health status: ' + error.toString());
    return 'Unknown';
  }
}

/**
 * Additional utility functions
 */
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

function cleanupOldBackups() {
  try {
    const backupFolder = DriveApp.getFolderById(INTEGRATION_CONFIG.BACKUP_CONFIG.DRIVE_FOLDER_ID);
    const files = backupFolder.getFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INTEGRATION_CONFIG.BACKUP_CONFIG.RETENTION_DAYS);
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated() < cutoffDate) {
        file.setTrashed(true);
        Logger.log(`Deleted old backup: ${file.getName()}`);
      }
    }
    
  } catch (error) {
    Logger.log('Error cleaning up old backups: ' + error.toString());
  }
}

function logBackupActivity(filename, fileId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.SPREADSHEET_ID);
    const auditSheet = spreadsheet.getSheetByName('AuditLog');
    
    const logEntry = [
      'LOG' + Date.now(),
      'SYSTEM',
      'Backup Created',
      'System',
      fileId,
      '', // Old values
      JSON.stringify({ filename: filename, fileId: fileId }),
      '', // IP address
      '', // User agent
      new Date()
    ];
    
    auditSheet.appendRow(logEntry);
    
  } catch (error) {
    Logger.log('Error logging backup activity: ' + error.toString());
  }
}

/**
 * Web app endpoint for manual automation triggers
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'runDailyWorkflows':
        runDailyWorkflows();
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Daily workflows completed' }))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'runWeeklyWorkflows':
        runWeeklyWorkflows();
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Weekly workflows completed' }))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'runMonthlyWorkflows':
        runMonthlyWorkflows();
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Monthly workflows completed' }))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'createBackup':
        backupCriticalData();
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Backup created successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'sendNotification':
        sendSlackNotification(data.message, data.channel);
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Notification sent' }))
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
    Logger.log('Error in automation doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Scheduled functions for automation
 */
function dailyAutomation() {
  runDailyWorkflows();
}

function weeklyAutomation() {
  runWeeklyWorkflows();
}

function monthlyAutomation() {
  runMonthlyWorkflows();
}

function hourlyChecks() {
  // Run every hour for critical checks
  checkSystemHealth();
  updateDashboardCache();
}