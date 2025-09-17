/**
 * Google Apps Script for Student Admission System
 * Handles form submissions and integrates with Google Sheets
 */

// Configuration
const CONFIG = {
  STUDENT_DB_SHEET_ID: 'YOUR_STUDENT_DB_SHEET_ID', // Replace with actual Sheet ID
  STUDENT_DB_SHEET_NAME: 'StudentDatabase',
  EMAIL_TEMPLATE_ID: 'YOUR_EMAIL_TEMPLATE_ID', // Replace with actual template ID
  ADMIN_EMAIL: 'admin@college.edu', // Replace with actual admin email
  WEBHOOK_URL: 'YOUR_WEBHOOK_URL' // For real-time notifications
};

/**
 * Main function to handle form submission
 * This function is called when the admission form is submitted
 */
function handleAdmissionSubmission(formData) {
  try {
    // Validate form data
    const validationResult = validateFormData(formData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error,
        studentId: null
      };
    }
    
    // Generate unique student ID
    const studentId = generateStudentId(formData);
    formData.studentId = studentId;
    formData.submissionDate = new Date();
    formData.status = 'Pending Review';
    
    // Save to student database
    const saveResult = saveToStudentDatabase(formData);
    if (!saveResult.success) {
      return {
        success: false,
        error: 'Failed to save student data',
        studentId: studentId
      };
    }
    
    // Send confirmation email to student
    sendConfirmationEmail(formData);
    
    // Notify admin
    notifyAdmin(formData);
    
    // Update hostel allocation if required
    if (formData.hostelRequired === 'Yes') {
      updateHostelAllocation(formData);
    }
    
    // Trigger fee collection workflow
    triggerFeeCollectionWorkflow(formData);
    
    return {
      success: true,
      studentId: studentId,
      message: 'Application submitted successfully'
    };
    
  } catch (error) {
    Logger.log('Error in handleAdmissionSubmission: ' + error.toString());
    return {
      success: false,
      error: 'System error occurred',
      studentId: null
    };
  }
}

/**
 * Validate form data
 */
function validateFormData(data) {
  const requiredFields = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 
    'email', 'phone', 'course', 'year', 'hostelRequired'
  ];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === '') {
      return {
        isValid: false,
        error: `Missing required field: ${field}`
      };
    }
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }
  
  // Validate phone number
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    return {
      isValid: false,
      error: 'Invalid phone number format'
    };
  }
  
  return { isValid: true };
}

/**
 * Generate unique student ID
 */
function generateStudentId(data) {
  const year = new Date().getFullYear().toString().slice(-2);
  const courseCode = getCourseCode(data.course);
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `STU${year}${courseCode}${randomNum}`;
}

/**
 * Get course code for student ID generation
 */
function getCourseCode(course) {
  const courseCodes = {
    'Computer Science': 'CS',
    'Business Administration': 'BA',
    'Engineering': 'EN',
    'Medicine': 'MD',
    'Arts': 'AR',
    'Science': 'SC'
  };
  
  return courseCodes[course] || 'GN';
}

/**
 * Save student data to Google Sheets
 */
function saveToStudentDatabase(data) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.STUDENT_DB_SHEET_ID)
      .getSheetByName(CONFIG.STUDENT_DB_SHEET_NAME);
    
    // Prepare row data
    const rowData = [
      data.studentId,
      data.firstName,
      data.lastName,
      data.dateOfBirth,
      data.gender,
      data.email,
      data.phone,
      data.emergencyContact,
      data.course,
      data.year,
      data.previousEducation || '',
      data.hostelRequired,
      data.hostelType || '',
      data.specialRequirements || '',
      data.submissionDate,
      data.status,
      '', // Fee status - will be updated by fee collection system
      '', // Hostel allocation - will be updated by hostel system
      '', // Examination records - will be updated by exam system
      ''  // Notes
    ];
    
    // Add new row
    sheet.appendRow(rowData);
    
    // Apply formatting to new row
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, rowData.length);
    
    // Add conditional formatting for status
    const statusColumn = 16; // Status column
    const statusRange = sheet.getRange(lastRow, statusColumn);
    
    if (data.status === 'Pending Review') {
      statusRange.setBackground('#fff3cd'); // Light yellow
    }
    
    return { success: true };
    
  } catch (error) {
    Logger.log('Error saving to database: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Send confirmation email to student
 */
function sendConfirmationEmail(data) {
  try {
    const subject = `Admission Application Confirmation - ${data.studentId}`;
    const body = `
Dear ${data.firstName} ${data.lastName},

Thank you for submitting your admission application to our institution.

Application Details:
- Student ID: ${data.studentId}
- Course: ${data.course}
- Academic Year: ${data.year}
- Status: ${data.status}

Next Steps:
1. Your application is under review
2. You will receive an email within 3-5 business days with further instructions
3. If approved, you will receive fee payment details
4. Hostel allocation (if requested) will be communicated separately

If you have any questions, please contact our admissions office.

Best regards,
Admissions Team
    `;
    
    GmailApp.sendEmail(data.email, subject, body);
    
  } catch (error) {
    Logger.log('Error sending confirmation email: ' + error.toString());
  }
}

/**
 * Notify admin about new application
 */
function notifyAdmin(data) {
  try {
    const subject = `New Admission Application - ${data.studentId}`;
    const body = `
New admission application received:

Student Details:
- Name: ${data.firstName} ${data.lastName}
- Student ID: ${data.studentId}
- Course: ${data.course}
- Email: ${data.email}
- Phone: ${data.phone}
- Hostel Required: ${data.hostelRequired}

Please review the application in the student database.

Dashboard: [Link to dashboard]
    `;
    
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    
  } catch (error) {
    Logger.log('Error notifying admin: ' + error.toString());
  }
}

/**
 * Update hostel allocation system
 */
function updateHostelAllocation(data) {
  try {
    // This would integrate with hostel management sheet
    const hostelSheet = SpreadsheetApp.openById(CONFIG.STUDENT_DB_SHEET_ID)
      .getSheetByName('HostelRequests');
    
    const hostelData = [
      data.studentId,
      data.firstName + ' ' + data.lastName,
      data.course,
      data.hostelType || 'Not Specified',
      data.specialRequirements || '',
      'Pending',
      new Date()
    ];
    
    hostelSheet.appendRow(hostelData);
    
  } catch (error) {
    Logger.log('Error updating hostel allocation: ' + error.toString());
  }
}

/**
 * Trigger fee collection workflow
 */
function triggerFeeCollectionWorkflow(data) {
  try {
    // Create fee collection record
    const feeSheet = SpreadsheetApp.openById(CONFIG.STUDENT_DB_SHEET_ID)
      .getSheetByName('FeeCollection');
    
    const feeData = [
      data.studentId,
      data.firstName + ' ' + data.lastName,
      data.course,
      data.year,
      calculateFeeAmount(data.course),
      'Pending',
      new Date(),
      '' // Payment date
    ];
    
    feeSheet.appendRow(feeData);
    
  } catch (error) {
    Logger.log('Error triggering fee collection: ' + error.toString());
  }
}

/**
 * Calculate fee amount based on course
 */
function calculateFeeAmount(course) {
  const feeStructure = {
    'Computer Science': 50000,
    'Business Administration': 45000,
    'Engineering': 60000,
    'Medicine': 80000,
    'Arts': 30000,
    'Science': 40000
  };
  
  return feeStructure[course] || 40000;
}

/**
 * Web app endpoint for form submission
 * This function is called via HTTP POST from the admission form
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = handleAdmissionSubmission(data);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
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
 * Utility function to get student data by ID
 */
function getStudentById(studentId) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.STUDENT_DB_SHEET_ID)
      .getSheetByName(CONFIG.STUDENT_DB_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) { // Assuming student ID is in first column
        const studentData = {};
        headers.forEach((header, index) => {
          studentData[header] = data[i][index];
        });
        return studentData;
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('Error getting student data: ' + error.toString());
    return null;
  }
}

/**
 * Update student status
 */
function updateStudentStatus(studentId, newStatus) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.STUDENT_DB_SHEET_ID)
      .getSheetByName(CONFIG.STUDENT_DB_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentId) {
        const statusColumn = 16; // Assuming status is in column 16
        sheet.getRange(i + 1, statusColumn).setValue(newStatus);
        
        // Update background color based on status
        const statusRange = sheet.getRange(i + 1, statusColumn);
        switch (newStatus) {
          case 'Approved':
            statusRange.setBackground('#d4edda'); // Light green
            break;
          case 'Rejected':
            statusRange.setBackground('#f8d7da'); // Light red
            break;
          case 'Pending Review':
            statusRange.setBackground('#fff3cd'); // Light yellow
            break;
        }
        
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('Error updating student status: ' + error.toString());
    return false;
  }
}