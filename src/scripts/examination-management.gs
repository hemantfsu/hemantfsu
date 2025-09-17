/**
 * Examination Management System
 * Handles examination records, grade management, and transcript generation
 */

// Configuration
const EXAM_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  EXAM_SHEET_NAME: 'ExaminationRecords',
  STUDENT_SHEET_NAME: 'StudentDatabase',
  GRADE_SHEET_NAME: 'GradeScale',
  TRANSCRIPT_TEMPLATE_ID: 'YOUR_TRANSCRIPT_TEMPLATE_ID', // Google Docs template
  ADMIN_EMAIL: 'admin@college.edu',
  EXAM_CONTROLLER_EMAIL: 'examcontroller@college.edu'
};

/**
 * Initialize grade scale
 */
function initializeGradeScale() {
  try {
    const spreadsheet = SpreadsheetApp.openById(EXAM_CONFIG.SPREADSHEET_ID);
    let gradeSheet;
    
    try {
      gradeSheet = spreadsheet.getSheetByName(EXAM_CONFIG.GRADE_SHEET_NAME);
    } catch (e) {
      gradeSheet = spreadsheet.insertSheet(EXAM_CONFIG.GRADE_SHEET_NAME);
    }
    
    // Set up headers
    const headers = [
      'Grade', 'GradePoint', 'Percentage', 'Description', 'Status'
    ];
    
    if (gradeSheet.getLastRow() === 0) {
      gradeSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = gradeSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#fbbc04');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      // Add grade scale data
      const gradeData = [
        ['A+', 10, '95-100', 'Outstanding', 'Pass'],
        ['A', 9, '85-94', 'Excellent', 'Pass'],
        ['B+', 8, '75-84', 'Very Good', 'Pass'],
        ['B', 7, '65-74', 'Good', 'Pass'],
        ['C+', 6, '55-64', 'Above Average', 'Pass'],
        ['C', 5, '45-54', 'Average', 'Pass'],
        ['D', 4, '35-44', 'Below Average', 'Pass'],
        ['F', 0, '0-34', 'Fail', 'Fail']
      ];
      
      gradeSheet.getRange(2, 1, gradeData.length, gradeData[0].length).setValues(gradeData);
      
      // Set column widths
      gradeSheet.setColumnWidth(1, 80);  // Grade
      gradeSheet.setColumnWidth(2, 100); // GradePoint
      gradeSheet.setColumnWidth(3, 100); // Percentage
      gradeSheet.setColumnWidth(4, 150); // Description
      gradeSheet.setColumnWidth(5, 100); // Status
      
      // Freeze header row
      gradeSheet.setFrozenRows(1);
    }
    
    Logger.log('Grade scale initialized successfully');
    
  } catch (error) {
    Logger.log('Error initializing grade scale: ' + error.toString());
  }
}

/**
 * Add examination record for a student
 */
function addExaminationRecord(studentId, examData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(EXAM_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName(EXAM_CONFIG.EXAM_SHEET_NAME);
    const studentSheet = spreadsheet.getSheetByName(EXAM_CONFIG.STUDENT_SHEET_NAME);
    
    // Get student data
    const studentData = getStudentData(studentSheet, studentId);
    if (!studentData) {
      throw new Error('Student not found: ' + studentId);
    }
    
    // Generate exam ID
    const examId = 'EXM' + Date.now();
    
    // Calculate grade and grade point
    const gradeInfo = calculateGrade(examData.marksObtained, examData.totalMarks);
    
    // Create exam record
    const examRecord = [
      examId,
      studentId,
      studentData.firstName + ' ' + studentData.lastName,
      studentData.course,
      studentData.academicYear,
      examData.semester,
      examData.subject,
      examData.examType,
      examData.marksObtained,
      examData.totalMarks,
      gradeInfo.grade,
      gradeInfo.gradePoint,
      examData.examDate,
      gradeInfo.status,
      examData.remarks || '',
      new Date(),
      new Date()
    ];
    
    // Add to examination records sheet
    examSheet.appendRow(examRecord);
    
    // Update student's examination records summary
    updateStudentExamSummary(studentSheet, studentId);
    
    // Send exam result notification
    sendExamResultNotification(studentData, examData, gradeInfo);
    
    Logger.log('Examination record added for student: ' + studentId);
    return {
      success: true,
      examId: examId,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
      status: gradeInfo.status
    };
    
  } catch (error) {
    Logger.log('Error adding examination record: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Calculate grade based on marks
 */
function calculateGrade(marksObtained, totalMarks) {
  const percentage = (marksObtained / totalMarks) * 100;
  
  let grade, gradePoint, status;
  
  if (percentage >= 95) {
    grade = 'A+';
    gradePoint = 10;
    status = 'Pass';
  } else if (percentage >= 85) {
    grade = 'A';
    gradePoint = 9;
    status = 'Pass';
  } else if (percentage >= 75) {
    grade = 'B+';
    gradePoint = 8;
    status = 'Pass';
  } else if (percentage >= 65) {
    grade = 'B';
    gradePoint = 7;
    status = 'Pass';
  } else if (percentage >= 55) {
    grade = 'C+';
    gradePoint = 6;
    status = 'Pass';
  } else if (percentage >= 45) {
    grade = 'C';
    gradePoint = 5;
    status = 'Pass';
  } else if (percentage >= 35) {
    grade = 'D';
    gradePoint = 4;
    status = 'Pass';
  } else {
    grade = 'F';
    gradePoint = 0;
    status = 'Fail';
  }
  
  return {
    grade: grade,
    gradePoint: gradePoint,
    status: status,
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Bulk upload examination results
 */
function bulkUploadExamResults(examResults) {
  try {
    const spreadsheet = SpreadsheetApp.openById(EXAM_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName(EXAM_CONFIG.EXAM_SHEET_NAME);
    
    const records = [];
    
    examResults.forEach(result => {
      const gradeInfo = calculateGrade(result.marksObtained, result.totalMarks);
      
      const examRecord = [
        'EXM' + Date.now() + Math.random().toString(36).substr(2, 5),
        result.studentId,
        result.studentName,
        result.course,
        result.academicYear,
        result.semester,
        result.subject,
        result.examType,
        result.marksObtained,
        result.totalMarks,
        gradeInfo.grade,
        gradeInfo.gradePoint,
        result.examDate,
        gradeInfo.status,
        result.remarks || '',
        new Date(),
        new Date()
      ];
      
      records.push(examRecord);
    });
    
    // Add all records at once
    if (records.length > 0) {
      examSheet.getRange(examSheet.getLastRow() + 1, 1, records.length, records[0].length).setValues(records);
    }
    
    // Send bulk result notifications
    sendBulkExamResultNotifications(examResults);
    
    Logger.log('Bulk examination results uploaded: ' + records.length + ' records');
    return {
      success: true,
      recordsProcessed: records.length
    };
    
  } catch (error) {
    Logger.log('Error in bulk upload: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate student transcript
 */
function generateStudentTranscript(studentId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(EXAM_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName(EXAM_CONFIG.EXAM_SHEET_NAME);
    const studentSheet = spreadsheet.getSheetByName(EXAM_CONFIG.STUDENT_SHEET_NAME);
    
    // Get student data
    const studentData = getStudentData(studentSheet, studentId);
    if (!studentData) {
      throw new Error('Student not found: ' + studentId);
    }
    
    // Get all exam records for student
    const examRecords = getStudentExamRecords(examSheet, studentId);
    if (examRecords.length === 0) {
      throw new Error('No examination records found for student');
    }
    
    // Calculate CGPA
    const cgpa = calculateCGPA(examRecords);
    
    // Create transcript document
    const transcriptUrl = createTranscriptDocument(studentData, examRecords, cgpa);
    
    // Send transcript to student
    sendTranscriptEmail(studentData, transcriptUrl);
    
    Logger.log('Transcript generated for student: ' + studentId);
    return {
      success: true,
      transcriptUrl: transcriptUrl,
      cgpa: cgpa
    };
    
  } catch (error) {
    Logger.log('Error generating transcript: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Calculate CGPA
 */
function calculateCGPA(examRecords) {
  let totalGradePoints = 0;
  let totalCredits = 0;
  
  examRecords.forEach(record => {
    const credits = getSubjectCredits(record.subject); // Assuming each subject has credits
    totalGradePoints += record.gradePoint * credits;
    totalCredits += credits;
  });
  
  return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
}

/**
 * Get subject credits (this would typically come from a course structure)
 */
function getSubjectCredits(subject) {
  // This is a simplified version - in reality, this would come from course structure
  const subjectCredits = {
    'Mathematics': 4,
    'Physics': 4,
    'Chemistry': 4,
    'Computer Science': 3,
    'English': 2,
    'History': 2,
    'Economics': 3,
    'Business Studies': 3
  };
  
  return subjectCredits[subject] || 3; // Default to 3 credits
}

/**
 * Create transcript document
 */
function createTranscriptDocument(studentData, examRecords, cgpa) {
  try {
    // Create transcript document from template
    const templateDoc = DocumentApp.openById(EXAM_CONFIG.TRANSCRIPT_TEMPLATE_ID);
    const transcriptDoc = templateDoc.copy('Transcript_' + studentData.studentid);
    
    // Replace placeholders in template
    const body = transcriptDoc.getBody();
    
    body.replaceText('{{STUDENT_ID}}', studentData.studentid);
    body.replaceText('{{STUDENT_NAME}}', studentData.firstname + ' ' + studentData.lastname);
    body.replaceText('{{COURSE}}', studentData.course);
    body.replaceText('{{ACADEMIC_YEAR}}', studentData.academicyear);
    body.replaceText('{{CGPA}}', cgpa.toFixed(2));
    body.replaceText('{{ISSUE_DATE}}', new Date().toLocaleDateString());
    body.replaceText('{{INSTITUTION_NAME}}', 'Educational Institution');
    
    // Add exam records table
    let examTableHtml = '<table border="1" style="width: 100%; border-collapse: collapse;">';
    examTableHtml += '<tr><th>Subject</th><th>Semester</th><th>Exam Type</th><th>Marks</th><th>Grade</th><th>Grade Point</th></tr>';
    
    examRecords.forEach(record => {
      examTableHtml += `<tr>
        <td>${record.subject}</td>
        <td>${record.semester}</td>
        <td>${record.examtype}</td>
        <td>${record.marksobtained}/${record.totalmarks}</td>
        <td>${record.grade}</td>
        <td>${record.gradepoint}</td>
      </tr>`;
    });
    
    examTableHtml += '</table>';
    
    // Replace exam records placeholder
    body.replaceText('{{EXAM_RECORDS}}', examTableHtml);
    
    // Save and get URL
    transcriptDoc.saveAndClose();
    const transcriptUrl = transcriptDoc.getUrl();
    
    return transcriptUrl;
    
  } catch (error) {
    Logger.log('Error creating transcript document: ' + error.toString());
    return null;
  }
}

/**
 * Get examination statistics
 */
function getExaminationStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(EXAM_CONFIG.SPREADSHEET_ID);
    const examSheet = spreadsheet.getSheetByName(EXAM_CONFIG.EXAM_SHEET_NAME);
    
    const data = examSheet.getDataRange().getValues();
    
    let totalExams = 0;
    let passedExams = 0;
    let failedExams = 0;
    let totalStudents = 0;
    const courseStats = {};
    const gradeDistribution = {};
    
    const studentSet = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = row[1];
      const course = row[3];
      const grade = row[10];
      const status = row[13];
      
      totalExams++;
      studentSet.add(studentId);
      
      if (status === 'Pass') {
        passedExams++;
      } else {
        failedExams++;
      }
      
      // Course statistics
      if (!courseStats[course]) {
        courseStats[course] = { total: 0, passed: 0, failed: 0 };
      }
      courseStats[course].total++;
      if (status === 'Pass') {
        courseStats[course].passed++;
      } else {
        courseStats[course].failed++;
      }
      
      // Grade distribution
      if (!gradeDistribution[grade]) {
        gradeDistribution[grade] = 0;
      }
      gradeDistribution[grade]++;
    }
    
    totalStudents = studentSet.size;
    
    const passRate = totalExams > 0 ? (passedExams / totalExams) * 100 : 0;
    
    return {
      totalExams: totalExams,
      totalStudents: totalStudents,
      passedExams: passedExams,
      failedExams: failedExams,
      passRate: Math.round(passRate * 100) / 100,
      courseStats: courseStats,
      gradeDistribution: gradeDistribution
    };
    
  } catch (error) {
    Logger.log('Error getting examination statistics: ' + error.toString());
    return null;
  }
}

/**
 * Send exam result notification
 */
function sendExamResultNotification(studentData, examData, gradeInfo) {
  try {
    const subject = `Examination Result - ${examData.subject}`;
    const body = `
Dear ${studentData.firstName} ${studentData.lastName},

Your examination result has been published.

Exam Details:
- Student ID: ${studentData.studentId}
- Subject: ${examData.subject}
- Exam Type: ${examData.examType}
- Semester: ${examData.semester}
- Marks Obtained: ${examData.marksObtained}/${examData.totalMarks}
- Grade: ${gradeInfo.grade}
- Grade Point: ${gradeInfo.gradePoint}
- Status: ${gradeInfo.status}

Percentage: ${gradeInfo.percentage}%

${gradeInfo.status === 'Pass' ? 
  'Congratulations on passing the examination!' : 
  'Unfortunately, you did not pass this examination. Please contact your faculty for guidance.'}

You can view your complete academic record in the student portal.

Best regards,
Examination Department
Educational Institution
    `;
    
    GmailApp.sendEmail(studentData.email, subject, body);
    
  } catch (error) {
    Logger.log('Error sending exam result notification: ' + error.toString());
  }
}

/**
 * Send bulk exam result notifications
 */
function sendBulkExamResultNotifications(examResults) {
  try {
    // Group results by student
    const studentResults = {};
    
    examResults.forEach(result => {
      if (!studentResults[result.studentId]) {
        studentResults[result.studentId] = [];
      }
      studentResults[result.studentId].push(result);
    });
    
    // Send notification to each student
    Object.keys(studentResults).forEach(studentId => {
      const results = studentResults[studentId];
      sendStudentExamResultsNotification(studentId, results);
    });
    
  } catch (error) {
    Logger.log('Error sending bulk notifications: ' + error.toString());
  }
}

/**
 * Send student exam results notification
 */
function sendStudentExamResultsNotification(studentId, results) {
  try {
    const subject = `Examination Results Published - ${results.length} Subjects`;
    let body = `
Dear Student,

Your examination results have been published for the following subjects:

`;
    
    results.forEach(result => {
      const gradeInfo = calculateGrade(result.marksObtained, result.totalMarks);
      body += `- ${result.subject}: ${result.marksObtained}/${result.totalMarks} (${gradeInfo.grade}) - ${gradeInfo.status}\n`;
    });
    
    body += `

Please check the student portal for detailed results and transcript.

Best regards,
Examination Department
Educational Institution
    `;
    
    // Note: Email would be sent to student's email from student database
    Logger.log('Bulk exam results notification sent to student: ' + studentId);
    
  } catch (error) {
    Logger.log('Error sending student exam results notification: ' + error.toString());
  }
}

/**
 * Send transcript email
 */
function sendTranscriptEmail(studentData, transcriptUrl) {
  try {
    const subject = `Academic Transcript - ${studentData.studentId}`;
    const body = `
Dear ${studentData.firstName} ${studentData.lastName},

Your academic transcript has been generated and is ready for download.

Transcript Details:
- Student ID: ${studentData.studentId}
- Course: ${studentData.course}
- Academic Year: ${studentData.academicYear}
- Generated Date: ${new Date().toLocaleDateString()}

Your transcript is attached to this email. Please keep it safe as it is an official document.

If you need any corrections or have questions about your transcript, please contact the examination department.

Best regards,
Examination Department
Educational Institution
    `;
    
    GmailApp.sendEmail(studentData.email, subject, body, {
      attachments: [transcriptUrl]
    });
    
  } catch (error) {
    Logger.log('Error sending transcript email: ' + error.toString());
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
        studentData[header.toLowerCase().replace(/\s+/g, '')] = data[i][index];
      });
      return studentData;
    }
  }
  return null;
}

function getStudentExamRecords(examSheet, studentId) {
  const data = examSheet.getDataRange().getValues();
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === studentId) { // Student ID is in column 2
      const record = {};
      headers.forEach((header, index) => {
        record[header.toLowerCase().replace(/\s+/g, '')] = data[i][index];
      });
      records.push(record);
    }
  }
  
  return records;
}

function updateStudentExamSummary(studentSheet, studentId) {
  // This would update a summary field in the student database
  // For now, just log the action
  Logger.log('Updated exam summary for student: ' + studentId);
}

/**
 * Web app endpoint for examination management
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'addExamRecord':
        const addResult = addExaminationRecord(data.studentId, data.examData);
        return ContentService
          .createTextOutput(JSON.stringify(addResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'bulkUpload':
        const bulkResult = bulkUploadExamResults(data.examResults);
        return ContentService
          .createTextOutput(JSON.stringify(bulkResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'generateTranscript':
        const transcriptResult = generateStudentTranscript(data.studentId);
        return ContentService
          .createTextOutput(JSON.stringify(transcriptResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'getStatistics':
        const stats = getExaminationStatistics();
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, data: stats }))
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
 * Scheduled function to send exam reminders
 */
function sendExamReminders() {
  try {
    // This would send reminders for upcoming exams
    Logger.log('Exam reminders sent');
  } catch (error) {
    Logger.log('Error sending exam reminders: ' + error.toString());
  }
}