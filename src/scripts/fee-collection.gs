/**
 * Automated Fee Collection System
 * Handles fee generation, payment processing, and receipt management
 */

// Configuration
const FEE_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  FEE_SHEET_NAME: 'FeeCollection',
  STUDENT_SHEET_NAME: 'StudentDatabase',
  RECEIPT_TEMPLATE_ID: 'YOUR_RECEIPT_TEMPLATE_ID', // Google Docs template
  PAYMENT_GATEWAY_WEBHOOK: 'YOUR_PAYMENT_WEBHOOK_URL',
  ADMIN_EMAIL: 'admin@college.edu'
};

/**
 * Generate fee structure for a student
 */
function generateFeeStructure(studentData) {
  const courseFees = {
    'Computer Science': {
      tuition: 50000,
      hostel: 15000,
      library: 2000,
      lab: 5000,
      exam: 3000,
      total: 75000
    },
    'Business Administration': {
      tuition: 45000,
      hostel: 15000,
      library: 2000,
      lab: 3000,
      exam: 3000,
      total: 68000
    },
    'Engineering': {
      tuition: 60000,
      hostel: 15000,
      library: 2000,
      lab: 8000,
      exam: 3000,
      total: 88000
    },
    'Medicine': {
      tuition: 80000,
      hostel: 15000,
      library: 2000,
      lab: 10000,
      exam: 5000,
      total: 120000
    },
    'Arts': {
      tuition: 30000,
      hostel: 15000,
      library: 2000,
      lab: 1000,
      exam: 2000,
      total: 50000
    },
    'Science': {
      tuition: 40000,
      hostel: 15000,
      library: 2000,
      lab: 4000,
      exam: 3000,
      total: 64000
    }
  };
  
  const courseFee = courseFees[studentData.course] || courseFees['Science'];
  
  // Adjust hostel fee if not required
  if (studentData.hostelRequired === 'No') {
    courseFee.hostel = 0;
    courseFee.total -= 15000;
  }
  
  return courseFee;
}

/**
 * Create fee record for a student
 */
function createFeeRecord(studentId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FEE_CONFIG.SPREADSHEET_ID);
    const studentSheet = spreadsheet.getSheetByName(FEE_CONFIG.STUDENT_SHEET_NAME);
    const feeSheet = spreadsheet.getSheetByName(FEE_CONFIG.FEE_SHEET_NAME);
    
    // Get student data
    const studentData = getStudentData(studentSheet, studentId);
    if (!studentData) {
      throw new Error('Student not found: ' + studentId);
    }
    
    // Generate fee structure
    const feeStructure = generateFeeStructure(studentData);
    
    // Generate unique fee ID
    const feeId = 'FEE' + Date.now();
    
    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create fee record
    const feeRecord = [
      feeId,
      studentId,
      studentData.firstName + ' ' + studentData.lastName,
      studentData.course,
      studentData.academicYear,
      feeStructure.total,
      'Pending',
      '', // Payment date
      '', // Payment method
      '', // Transaction ID
      '', // Receipt number
      dueDate,
      0, // Late fee
      feeStructure.total, // Total amount
      'Fee generated automatically upon admission approval',
      new Date(),
      new Date()
    ];
    
    // Add to fee collection sheet
    feeSheet.appendRow(feeRecord);
    
    // Send fee notification to student
    sendFeeNotification(studentData, feeStructure, feeId, dueDate);
    
    // Update student database fee status
    updateStudentFeeStatus(studentSheet, studentId, 'Pending');
    
    Logger.log('Fee record created for student: ' + studentId);
    return {
      success: true,
      feeId: feeId,
      amount: feeStructure.total,
      dueDate: dueDate
    };
    
  } catch (error) {
    Logger.log('Error creating fee record: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Process payment and generate receipt
 */
function processPayment(feeId, paymentData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FEE_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName(FEE_CONFIG.FEE_SHEET_NAME);
    
    // Find fee record
    const feeRecord = findFeeRecord(feeSheet, feeId);
    if (!feeRecord) {
      throw new Error('Fee record not found: ' + feeId);
    }
    
    // Validate payment amount
    if (paymentData.amount < feeRecord.feeAmount) {
      throw new Error('Payment amount is less than required fee');
    }
    
    // Generate receipt number
    const receiptNumber = 'RCP' + Date.now();
    
    // Update fee record
    const rowIndex = feeRecord.rowIndex;
    feeSheet.getRange(rowIndex, 7).setValue('Paid'); // Payment status
    feeSheet.getRange(rowIndex, 8).setValue(new Date()); // Payment date
    feeSheet.getRange(rowIndex, 9).setValue(paymentData.method); // Payment method
    feeSheet.getRange(rowIndex, 10).setValue(paymentData.transactionId); // Transaction ID
    feeSheet.getRange(rowIndex, 11).setValue(receiptNumber); // Receipt number
    feeSheet.getRange(rowIndex, 16).setValue(new Date()); // Updated at
    
    // Generate receipt
    const receiptUrl = generateReceipt(feeRecord, paymentData, receiptNumber);
    
    // Send receipt to student
    sendReceiptEmail(feeRecord, receiptUrl);
    
    // Update student database
    updateStudentFeeStatus(spreadsheet.getSheetByName(FEE_CONFIG.STUDENT_SHEET_NAME), 
                          feeRecord.studentId, 'Paid');
    
    // Log payment
    logPaymentActivity(feeRecord, paymentData, receiptNumber);
    
    Logger.log('Payment processed successfully for fee: ' + feeId);
    return {
      success: true,
      receiptNumber: receiptNumber,
      receiptUrl: receiptUrl
    };
    
  } catch (error) {
    Logger.log('Error processing payment: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate digital receipt
 */
function generateReceipt(feeRecord, paymentData, receiptNumber) {
  try {
    // Create receipt document from template
    const templateDoc = DocumentApp.openById(FEE_CONFIG.RECEIPT_TEMPLATE_ID);
    const receiptDoc = templateDoc.copy('Receipt_' + receiptNumber);
    
    // Replace placeholders in template
    const body = receiptDoc.getBody();
    
    body.replaceText('{{RECEIPT_NUMBER}}', receiptNumber);
    body.replaceText('{{STUDENT_ID}}', feeRecord.studentId);
    body.replaceText('{{STUDENT_NAME}}', feeRecord.studentName);
    body.replaceText('{{COURSE}}', feeRecord.course);
    body.replaceText('{{ACADEMIC_YEAR}}', feeRecord.academicYear);
    body.replaceText('{{FEE_AMOUNT}}', '₹' + feeRecord.feeAmount);
    body.replaceText('{{PAYMENT_METHOD}}', paymentData.method);
    body.replaceText('{{TRANSACTION_ID}}', paymentData.transactionId);
    body.replaceText('{{PAYMENT_DATE}}', new Date().toLocaleDateString());
    body.replaceText('{{INSTITUTION_NAME}}', 'Educational Institution');
    body.replaceText('{{INSTITUTION_ADDRESS}}', '123 College Street, City, State - 123456');
    
    // Save and get URL
    receiptDoc.saveAndClose();
    const receiptUrl = receiptDoc.getUrl();
    
    return receiptUrl;
    
  } catch (error) {
    Logger.log('Error generating receipt: ' + error.toString());
    return null;
  }
}

/**
 * Send fee notification to student
 */
function sendFeeNotification(studentData, feeStructure, feeId, dueDate) {
  try {
    const subject = `Fee Payment Required - ${studentData.studentId}`;
    const body = `
Dear ${studentData.firstName} ${studentData.lastName},

Your admission has been approved! Please complete your fee payment to secure your place.

Payment Details:
- Student ID: ${studentData.studentId}
- Course: ${studentData.course}
- Academic Year: ${studentData.academicYear}
- Fee ID: ${feeId}

Fee Breakdown:
- Tuition Fee: ₹${feeStructure.tuition}
- Hostel Fee: ₹${feeStructure.hostel}
- Library Fee: ₹${feeStructure.library}
- Lab Fee: ₹${feeStructure.lab}
- Examination Fee: ₹${feeStructure.exam}
- Total Amount: ₹${feeStructure.total}

Payment Due Date: ${dueDate.toLocaleDateString()}

Payment Methods:
1. Online Payment: [Payment Gateway Link]
2. Bank Transfer: [Bank Details]
3. Cash Payment: Visit Accounts Office

Please make payment before the due date to avoid late fees.

If you have any questions, please contact our accounts office.

Best regards,
Accounts Team
Educational Institution
    `;
    
    GmailApp.sendEmail(studentData.email, subject, body);
    
  } catch (error) {
    Logger.log('Error sending fee notification: ' + error.toString());
  }
}

/**
 * Send receipt email to student
 */
function sendReceiptEmail(feeRecord, receiptUrl) {
  try {
    const subject = `Payment Receipt - ${feeRecord.studentId}`;
    const body = `
Dear ${feeRecord.studentName},

Thank you for your payment! Your fee has been successfully processed.

Payment Details:
- Student ID: ${feeRecord.studentId}
- Receipt Number: ${feeRecord.receiptNumber}
- Amount Paid: ₹${feeRecord.feeAmount}
- Payment Date: ${new Date().toLocaleDateString()}

Your receipt is attached. Please keep this for your records.

Next Steps:
1. Your admission is now confirmed
2. You will receive hostel allocation details (if applicable)
3. Academic calendar and orientation details will be sent separately

Welcome to our institution!

Best regards,
Accounts Team
Educational Institution
    `;
    
    GmailApp.sendEmail(feeRecord.email, subject, body, {
      attachments: [receiptUrl]
    });
    
  } catch (error) {
    Logger.log('Error sending receipt email: ' + error.toString());
  }
}

/**
 * Check for overdue payments and send reminders
 */
function checkOverduePayments() {
  try {
    const spreadsheet = SpreadsheetApp.openById(FEE_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName(FEE_CONFIG.FEE_SHEET_NAME);
    
    const data = feeSheet.getDataRange().getValues();
    const headers = data[0];
    
    const today = new Date();
    const overdueStudents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const paymentStatus = row[6]; // Payment status column
      const dueDate = new Date(row[11]); // Due date column
      
      if (paymentStatus === 'Pending' && dueDate < today) {
        overdueStudents.push({
          feeId: row[0],
          studentId: row[1],
          studentName: row[2],
          email: row[3], // Assuming email is in column 3
          amount: row[5],
          dueDate: dueDate,
          daysOverdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // Send reminders to overdue students
    overdueStudents.forEach(student => {
      sendOverdueReminder(student);
      updateLateFee(student.feeId, student.daysOverdue);
    });
    
    // Notify admin about overdue payments
    if (overdueStudents.length > 0) {
      notifyAdminOverduePayments(overdueStudents);
    }
    
    Logger.log(`Checked overdue payments: ${overdueStudents.length} students overdue`);
    
  } catch (error) {
    Logger.log('Error checking overdue payments: ' + error.toString());
  }
}

/**
 * Send overdue payment reminder
 */
function sendOverdueReminder(student) {
  try {
    const subject = `Payment Overdue - ${student.studentId}`;
    const body = `
Dear ${student.studentName},

Your fee payment is overdue by ${student.daysOverdue} days.

Payment Details:
- Student ID: ${student.studentId}
- Amount Due: ₹${student.amount}
- Due Date: ${student.dueDate.toLocaleDateString()}
- Days Overdue: ${student.daysOverdue}

Late Fee: ₹${calculateLateFee(student.amount, student.daysOverdue)}

Please make payment immediately to avoid further penalties and potential admission cancellation.

Payment Methods:
1. Online Payment: [Payment Gateway Link]
2. Bank Transfer: [Bank Details]
3. Cash Payment: Visit Accounts Office

If you have already made payment, please contact us with your transaction details.

Best regards,
Accounts Team
Educational Institution
    `;
    
    GmailApp.sendEmail(student.email, subject, body);
    
  } catch (error) {
    Logger.log('Error sending overdue reminder: ' + error.toString());
  }
}

/**
 * Calculate late fee
 */
function calculateLateFee(amount, daysOverdue) {
  const lateFeePercentage = 5; // 5% per month
  const monthlyLateFee = (amount * lateFeePercentage) / 100;
  const daysInMonth = 30;
  const lateFee = (monthlyLateFee * daysOverdue) / daysInMonth;
  
  return Math.round(lateFee);
}

/**
 * Update late fee in fee record
 */
function updateLateFee(feeId, daysOverdue) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FEE_CONFIG.SPREADSHEET_ID);
    const feeSheet = spreadsheet.getSheetByName(FEE_CONFIG.FEE_SHEET_NAME);
    
    const feeRecord = findFeeRecord(feeSheet, feeId);
    if (feeRecord) {
      const lateFee = calculateLateFee(feeRecord.feeAmount, daysOverdue);
      const totalAmount = feeRecord.feeAmount + lateFee;
      
      const rowIndex = feeRecord.rowIndex;
      feeSheet.getRange(rowIndex, 12).setValue(lateFee); // Late fee
      feeSheet.getRange(rowIndex, 13).setValue(totalAmount); // Total amount
      feeSheet.getRange(rowIndex, 6).setValue('Overdue'); // Payment status
    }
    
  } catch (error) {
    Logger.log('Error updating late fee: ' + error.toString());
  }
}

/**
 * Utility functions
 */
function getStudentData(studentSheet, studentId) {
  const data = studentSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === studentId) {
      const studentData = {};
      headers.forEach((header, index) => {
        studentData[header.toLowerCase()] = data[i][index];
      });
      return studentData;
    }
  }
  return null;
}

function findFeeRecord(feeSheet, feeId) {
  const data = feeSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === feeId) {
      const feeRecord = {};
      headers.forEach((header, index) => {
        feeRecord[header.toLowerCase()] = data[i][index];
      });
      feeRecord.rowIndex = i + 1;
      return feeRecord;
    }
  }
  return null;
}

function updateStudentFeeStatus(studentSheet, studentId, status) {
  const data = studentSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === studentId) {
      const feeStatusColumn = 17; // Assuming fee status is in column 17
      studentSheet.getRange(i + 1, feeStatusColumn).setValue(status);
      break;
    }
  }
}

function logPaymentActivity(feeRecord, paymentData, receiptNumber) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FEE_CONFIG.SPREADSHEET_ID);
    const auditSheet = spreadsheet.getSheetByName('AuditLog');
    
    const logEntry = [
      'LOG' + Date.now(),
      'SYSTEM',
      'Payment Processed',
      'FeeCollection',
      feeRecord.feeId,
      '', // Old values
      JSON.stringify({
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
        receiptNumber: receiptNumber
      }),
      '', // IP address
      '', // User agent
      new Date()
    ];
    
    auditSheet.appendRow(logEntry);
    
  } catch (error) {
    Logger.log('Error logging payment activity: ' + error.toString());
  }
}

function notifyAdminOverduePayments(overdueStudents) {
  try {
    const subject = `Overdue Payments Alert - ${overdueStudents.length} Students`;
    const body = `
Dear Admin,

The following students have overdue payments:

${overdueStudents.map(student => 
  `- ${student.studentName} (${student.studentId}): ₹${student.amount} - ${student.daysOverdue} days overdue`
).join('\n')}

Total Overdue Amount: ₹${overdueStudents.reduce((sum, student) => sum + student.amount, 0)}

Please follow up with these students or consider appropriate actions.

Dashboard: [Link to dashboard]
    `;
    
    GmailApp.sendEmail(FEE_CONFIG.ADMIN_EMAIL, subject, body);
    
  } catch (error) {
    Logger.log('Error notifying admin: ' + error.toString());
  }
}

/**
 * Web app endpoint for payment processing
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'processPayment') {
      const result = processPayment(data.feeId, data.paymentData);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Scheduled function to check overdue payments daily
 */
function dailyOverdueCheck() {
  checkOverduePayments();
}