/**
 * Google Sheets Setup Script for Educational Institution ERP
 * Creates and configures all required sheets with proper formatting
 */

// Configuration
const CONFIG = {
  SPREADSHEET_NAME: 'Educational Institution ERP - Student Management System',
  SHEETS: [
    'StudentDatabase',
    'FeeCollection', 
    'HostelManagement',
    'ExaminationRecords',
    'UserAccess',
    'AuditLog',
    'Notifications',
    'SystemConfig'
  ]
};

/**
 * Main setup function - creates the entire ERP system
 */
function setupERPSystem() {
  try {
    // Create new spreadsheet
    const spreadsheet = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    const spreadsheetId = spreadsheet.getId();
    
    Logger.log('Created spreadsheet with ID: ' + spreadsheetId);
    
    // Remove default sheet
    const defaultSheet = spreadsheet.getSheets()[0];
    if (defaultSheet.getName() === 'Sheet1') {
      spreadsheet.deleteSheet(defaultSheet);
    }
    
    // Create all required sheets
    createStudentDatabaseSheet(spreadsheet);
    createFeeCollectionSheet(spreadsheet);
    createHostelManagementSheet(spreadsheet);
    createExaminationRecordsSheet(spreadsheet);
    createUserAccessSheet(spreadsheet);
    createAuditLogSheet(spreadsheet);
    createNotificationsSheet(spreadsheet);
    createSystemConfigSheet(spreadsheet);
    
    // Set up data validation and formatting
    setupDataValidation(spreadsheet);
    setupConditionalFormatting(spreadsheet);
    setupProtection(spreadsheet);
    
    // Create dashboard sheet
    createDashboardSheet(spreadsheet);
    
    Logger.log('ERP system setup completed successfully!');
    Logger.log('Spreadsheet URL: ' + spreadsheet.getUrl());
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      url: spreadsheet.getUrl()
    };
    
  } catch (error) {
    Logger.log('Error setting up ERP system: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create Student Database Sheet
 */
function createStudentDatabaseSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('StudentDatabase');
  
  const headers = [
    'StudentID', 'FirstName', 'LastName', 'DateOfBirth', 'Gender',
    'Email', 'Phone', 'EmergencyContact', 'Course', 'AcademicYear',
    'PreviousEducation', 'HostelRequired', 'HostelType', 'SpecialRequirements',
    'SubmissionDate', 'Status', 'FeeStatus', 'HostelAllocation',
    'ExaminationRecords', 'Notes', 'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // StudentID
  sheet.setColumnWidth(2, 100); // FirstName
  sheet.setColumnWidth(3, 100); // LastName
  sheet.setColumnWidth(4, 100); // DateOfBirth
  sheet.setColumnWidth(5, 80);  // Gender
  sheet.setColumnWidth(6, 150); // Email
  sheet.setColumnWidth(7, 120); // Phone
  sheet.setColumnWidth(8, 120); // EmergencyContact
  sheet.setColumnWidth(9, 150); // Course
  sheet.setColumnWidth(10, 100); // AcademicYear
  sheet.setColumnWidth(11, 200); // PreviousEducation
  sheet.setColumnWidth(12, 100); // HostelRequired
  sheet.setColumnWidth(13, 100); // HostelType
  sheet.setColumnWidth(14, 200); // SpecialRequirements
  sheet.setColumnWidth(15, 120); // SubmissionDate
  sheet.setColumnWidth(16, 120); // Status
  sheet.setColumnWidth(17, 100); // FeeStatus
  sheet.setColumnWidth(18, 120); // HostelAllocation
  sheet.setColumnWidth(19, 150); // ExaminationRecords
  sheet.setColumnWidth(20, 200); // Notes
  sheet.setColumnWidth(21, 120); // CreatedAt
  sheet.setColumnWidth(22, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create Fee Collection Sheet
 */
function createFeeCollectionSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('FeeCollection');
  
  const headers = [
    'FeeID', 'StudentID', 'StudentName', 'Course', 'AcademicYear',
    'FeeAmount', 'PaymentStatus', 'PaymentDate', 'PaymentMethod',
    'TransactionID', 'ReceiptNumber', 'DueDate', 'LateFee',
    'TotalAmount', 'Notes', 'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#34a853');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // FeeID
  sheet.setColumnWidth(2, 120); // StudentID
  sheet.setColumnWidth(3, 150); // StudentName
  sheet.setColumnWidth(4, 150); // Course
  sheet.setColumnWidth(5, 100); // AcademicYear
  sheet.setColumnWidth(6, 100); // FeeAmount
  sheet.setColumnWidth(7, 120); // PaymentStatus
  sheet.setColumnWidth(8, 120); // PaymentDate
  sheet.setColumnWidth(9, 120); // PaymentMethod
  sheet.setColumnWidth(10, 150); // TransactionID
  sheet.setColumnWidth(11, 120); // ReceiptNumber
  sheet.setColumnWidth(12, 100); // DueDate
  sheet.setColumnWidth(13, 100); // LateFee
  sheet.setColumnWidth(14, 100); // TotalAmount
  sheet.setColumnWidth(15, 200); // Notes
  sheet.setColumnWidth(16, 120); // CreatedAt
  sheet.setColumnWidth(17, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create Hostel Management Sheet
 */
function createHostelManagementSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('HostelManagement');
  
  const headers = [
    'HostelID', 'StudentID', 'StudentName', 'Course', 'HostelType',
    'RoomNumber', 'BedNumber', 'SpecialRequirements', 'AllocationStatus',
    'AllocationDate', 'CheckInDate', 'CheckOutDate', 'MonthlyRent',
    'SecurityDeposit', 'PaymentStatus', 'Notes', 'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#ea4335');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // HostelID
  sheet.setColumnWidth(2, 120); // StudentID
  sheet.setColumnWidth(3, 150); // StudentName
  sheet.setColumnWidth(4, 150); // Course
  sheet.setColumnWidth(5, 120); // HostelType
  sheet.setColumnWidth(6, 100); // RoomNumber
  sheet.setColumnWidth(7, 100); // BedNumber
  sheet.setColumnWidth(8, 200); // SpecialRequirements
  sheet.setColumnWidth(9, 120); // AllocationStatus
  sheet.setColumnWidth(10, 120); // AllocationDate
  sheet.setColumnWidth(11, 100); // CheckInDate
  sheet.setColumnWidth(12, 100); // CheckOutDate
  sheet.setColumnWidth(13, 100); // MonthlyRent
  sheet.setColumnWidth(14, 120); // SecurityDeposit
  sheet.setColumnWidth(15, 120); // PaymentStatus
  sheet.setColumnWidth(16, 200); // Notes
  sheet.setColumnWidth(17, 120); // CreatedAt
  sheet.setColumnWidth(18, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create Examination Records Sheet
 */
function createExaminationRecordsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('ExaminationRecords');
  
  const headers = [
    'ExamID', 'StudentID', 'StudentName', 'Course', 'AcademicYear',
    'Semester', 'Subject', 'ExamType', 'MarksObtained', 'TotalMarks',
    'Grade', 'GradePoint', 'ExamDate', 'ResultStatus', 'Remarks',
    'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#fbbc04');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // ExamID
  sheet.setColumnWidth(2, 120); // StudentID
  sheet.setColumnWidth(3, 150); // StudentName
  sheet.setColumnWidth(4, 150); // Course
  sheet.setColumnWidth(5, 100); // AcademicYear
  sheet.setColumnWidth(6, 100); // Semester
  sheet.setColumnWidth(7, 150); // Subject
  sheet.setColumnWidth(8, 100); // ExamType
  sheet.setColumnWidth(9, 100); // MarksObtained
  sheet.setColumnWidth(10, 100); // TotalMarks
  sheet.setColumnWidth(11, 80);  // Grade
  sheet.setColumnWidth(12, 100); // GradePoint
  sheet.setColumnWidth(13, 100); // ExamDate
  sheet.setColumnWidth(14, 120); // ResultStatus
  sheet.setColumnWidth(15, 200); // Remarks
  sheet.setColumnWidth(16, 120); // CreatedAt
  sheet.setColumnWidth(17, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create User Access Sheet
 */
function createUserAccessSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('UserAccess');
  
  const headers = [
    'UserID', 'Email', 'FullName', 'Role', 'Department',
    'Permissions', 'IsActive', 'LastLogin', 'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#9c27b0');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // UserID
  sheet.setColumnWidth(2, 150); // Email
  sheet.setColumnWidth(3, 150); // FullName
  sheet.setColumnWidth(4, 120); // Role
  sheet.setColumnWidth(5, 120); // Department
  sheet.setColumnWidth(6, 200); // Permissions
  sheet.setColumnWidth(7, 80);  // IsActive
  sheet.setColumnWidth(8, 120); // LastLogin
  sheet.setColumnWidth(9, 120); // CreatedAt
  sheet.setColumnWidth(10, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create Audit Log Sheet
 */
function createAuditLogSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('AuditLog');
  
  const headers = [
    'LogID', 'UserID', 'Action', 'TableName', 'RecordID',
    'OldValues', 'NewValues', 'IPAddress', 'UserAgent', 'Timestamp'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#607d8b');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // LogID
  sheet.setColumnWidth(2, 100); // UserID
  sheet.setColumnWidth(3, 120); // Action
  sheet.setColumnWidth(4, 100); // TableName
  sheet.setColumnWidth(5, 100); // RecordID
  sheet.setColumnWidth(6, 200); // OldValues
  sheet.setColumnWidth(7, 200); // NewValues
  sheet.setColumnWidth(8, 120); // IPAddress
  sheet.setColumnWidth(9, 200); // UserAgent
  sheet.setColumnWidth(10, 120); // Timestamp
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create Notifications Sheet
 */
function createNotificationsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Notifications');
  
  const headers = [
    'NotificationID', 'RecipientEmail', 'Subject', 'Message',
    'NotificationType', 'Status', 'ScheduledAt', 'SentAt',
    'RetryCount', 'ErrorMessage', 'CreatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#ff9800');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // NotificationID
  sheet.setColumnWidth(2, 150); // RecipientEmail
  sheet.setColumnWidth(3, 200); // Subject
  sheet.setColumnWidth(4, 300); // Message
  sheet.setColumnWidth(5, 120); // NotificationType
  sheet.setColumnWidth(6, 100); // Status
  sheet.setColumnWidth(7, 120); // ScheduledAt
  sheet.setColumnWidth(8, 120); // SentAt
  sheet.setColumnWidth(9, 100); // RetryCount
  sheet.setColumnWidth(10, 200); // ErrorMessage
  sheet.setColumnWidth(11, 120); // CreatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create System Config Sheet
 */
function createSystemConfigSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('SystemConfig');
  
  const headers = [
    'ConfigID', 'ConfigKey', 'ConfigValue', 'Description',
    'IsActive', 'CreatedAt', 'UpdatedAt'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#795548');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // ConfigID
  sheet.setColumnWidth(2, 150); // ConfigKey
  sheet.setColumnWidth(3, 200); // ConfigValue
  sheet.setColumnWidth(4, 250); // Description
  sheet.setColumnWidth(5, 80);  // IsActive
  sheet.setColumnWidth(6, 120); // CreatedAt
  sheet.setColumnWidth(7, 120); // UpdatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add default configuration
  const defaultConfig = [
    ['CONFIG001', 'INSTITUTION_NAME', 'Educational Institution', 'Name of the educational institution', 'TRUE', new Date(), new Date()],
    ['CONFIG002', 'INSTITUTION_EMAIL', 'admin@college.edu', 'Main institutional email address', 'TRUE', new Date(), new Date()],
    ['CONFIG003', 'ADMISSION_OPEN', 'TRUE', 'Whether admissions are currently open', 'TRUE', new Date(), new Date()],
    ['CONFIG004', 'FEE_DUE_DAYS', '30', 'Number of days after admission for fee payment', 'TRUE', new Date(), new Date()],
    ['CONFIG005', 'HOSTEL_CAPACITY', '500', 'Total hostel capacity', 'TRUE', new Date(), new Date()],
    ['CONFIG006', 'LATE_FEE_PERCENTAGE', '5', 'Late fee percentage per month', 'TRUE', new Date(), new Date()]
  ];
  
  sheet.getRange(2, 1, defaultConfig.length, defaultConfig[0].length).setValues(defaultConfig);
}

/**
 * Create Dashboard Sheet
 */
function createDashboardSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Dashboard', 0); // Insert as first sheet
  
  // Dashboard title
  sheet.getRange('A1').setValue('Educational Institution ERP - Dashboard');
  sheet.getRange('A1').setFontSize(20);
  sheet.getRange('A1').setFontWeight('bold');
  sheet.getRange('A1').setBackground('#4285f4');
  sheet.getRange('A1').setFontColor('white');
  
  // Merge cells for title
  sheet.getRange('A1:F1').merge();
  
  // Dashboard sections
  const sections = [
    { title: '📊 Student Statistics', range: 'A3:F8' },
    { title: '💰 Fee Collection Status', range: 'A10:F15' },
    { title: '🏠 Hostel Occupancy', range: 'A17:F22' },
    { title: '📚 Examination Summary', range: 'A24:F29' },
    { title: '🔔 Recent Activities', range: 'A31:F36' }
  ];
  
  sections.forEach(section => {
    const range = sheet.getRange(section.range);
    range.setBorder(true, true, true, true, true, true);
    range.setBackground('#f5f5f5');
    
    // Set title
    sheet.getRange(section.range.split(':')[0]).setValue(section.title);
    sheet.getRange(section.range.split(':')[0]).setFontWeight('bold');
    sheet.getRange(section.range.split(':')[0]).setFontSize(14);
  });
  
  // Add sample data
  sheet.getRange('A4').setValue('Total Students: 0');
  sheet.getRange('A5').setValue('New Applications: 0');
  sheet.getRange('A6').setValue('Approved Students: 0');
  sheet.getRange('A7').setValue('Pending Reviews: 0');
  
  sheet.getRange('A11').setValue('Total Fee Due: ₹0');
  sheet.getRange('A12').setValue('Paid Amount: ₹0');
  sheet.getRange('A13').setValue('Pending Amount: ₹0');
  sheet.getRange('A14').setValue('Overdue Amount: ₹0');
  
  sheet.getRange('A18').setValue('Total Capacity: 500');
  sheet.getRange('A19').setValue('Occupied: 0');
  sheet.getRange('A20').setValue('Available: 500');
  sheet.getRange('A21').setValue('Pending Requests: 0');
  
  sheet.getRange('A25').setValue('Total Exams: 0');
  sheet.getRange('A26').setValue('Completed: 0');
  sheet.getRange('A27').setValue('Pending: 0');
  sheet.getRange('A28').setValue('Average Score: 0%');
  
  sheet.getRange('A32').setValue('Last Updated: ' + new Date().toLocaleString());
  
  // Set column widths
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 100);
}

/**
 * Setup data validation for all sheets
 */
function setupDataValidation(spreadsheet) {
  // Student Database validation
  const studentSheet = spreadsheet.getSheetByName('StudentDatabase');
  
  // Gender validation
  const genderRange = studentSheet.getRange('E:E');
  const genderRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Male', 'Female', 'Other'])
    .setAllowInvalid(false)
    .build();
  genderRange.setDataValidation(genderRule);
  
  // Status validation
  const statusRange = studentSheet.getRange('P:P');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending Review', 'Approved', 'Rejected', 'On Hold'])
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);
  
  // Fee Collection validation
  const feeSheet = spreadsheet.getSheetByName('FeeCollection');
  
  // Payment Status validation
  const paymentStatusRange = feeSheet.getRange('G:G');
  const paymentStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Paid', 'Partial', 'Overdue'])
    .setAllowInvalid(false)
    .build();
  paymentStatusRange.setDataValidation(paymentStatusRule);
  
  // Hostel Management validation
  const hostelSheet = spreadsheet.getSheetByName('HostelManagement');
  
  // Allocation Status validation
  const allocationStatusRange = hostelSheet.getRange('I:I');
  const allocationStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Allocated', 'Rejected', 'Vacated'])
    .setAllowInvalid(false)
    .build();
  allocationStatusRange.setDataValidation(allocationStatusRule);
}

/**
 * Setup conditional formatting
 */
function setupConditionalFormatting(spreadsheet) {
  // Student Database conditional formatting
  const studentSheet = spreadsheet.getSheetByName('StudentDatabase');
  
  // Status column formatting
  const statusRange = studentSheet.getRange('P:P');
  
  // Approved - Green
  const approvedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Approved')
    .setBackground('#d4edda')
    .setRanges([statusRange])
    .build();
  
  // Rejected - Red
  const rejectedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Rejected')
    .setBackground('#f8d7da')
    .setRanges([statusRange])
    .build();
  
  // Pending Review - Yellow
  const pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending Review')
    .setBackground('#fff3cd')
    .setRanges([statusRange])
    .build();
  
  studentSheet.setConditionalFormatRules([approvedRule, rejectedRule, pendingRule]);
  
  // Fee Collection conditional formatting
  const feeSheet = spreadsheet.getSheetByName('FeeCollection');
  
  // Payment Status formatting
  const paymentStatusRange = feeSheet.getRange('G:G');
  
  // Paid - Green
  const paidRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Paid')
    .setBackground('#d4edda')
    .setRanges([paymentStatusRange])
    .build();
  
  // Overdue - Red
  const overdueRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Overdue')
    .setBackground('#f8d7da')
    .setRanges([paymentStatusRange])
    .build();
  
  // Pending - Yellow
  const pendingFeeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#fff3cd')
    .setRanges([paymentStatusRange])
    .build();
  
  feeSheet.setConditionalFormatRules([paidRule, overdueRule, pendingFeeRule]);
}

/**
 * Setup sheet protection
 */
function setupProtection(spreadsheet) {
  const sheets = spreadsheet.getSheets();
  
  sheets.forEach(sheet => {
    if (sheet.getName() !== 'Dashboard') {
      const protection = sheet.protect().setDescription('Protected sheet - Contact admin for access');
      protection.setWarningOnly(true);
    }
  });
}

/**
 * Test function to verify setup
 */
function testSetup() {
  const result = setupERPSystem();
  if (result.success) {
    Logger.log('Setup completed successfully!');
    Logger.log('Spreadsheet URL: ' + result.url);
  } else {
    Logger.log('Setup failed: ' + result.error);
  }
}