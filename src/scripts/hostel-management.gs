/**
 * Hostel Management System
 * Handles hostel allocation, occupancy tracking, and room management
 */

// Configuration
const HOSTEL_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Replace with actual ID
  HOSTEL_SHEET_NAME: 'HostelManagement',
  STUDENT_SHEET_NAME: 'StudentDatabase',
  ROOM_CAPACITY_SHEET_NAME: 'RoomCapacity',
  ADMIN_EMAIL: 'admin@college.edu',
  HOSTEL_WARDEN_EMAIL: 'warden@college.edu'
};

/**
 * Initialize hostel capacity data
 */
function initializeHostelCapacity() {
  try {
    const spreadsheet = SpreadsheetApp.openById(HOSTEL_CONFIG.SPREADSHEET_ID);
    let capacitySheet;
    
    try {
      capacitySheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.ROOM_CAPACITY_SHEET_NAME);
    } catch (e) {
      capacitySheet = spreadsheet.insertSheet(HOSTEL_CONFIG.ROOM_CAPACITY_SHEET_NAME);
    }
    
    // Set up headers
    const headers = [
      'HostelBlock', 'RoomNumber', 'RoomType', 'Capacity', 'Occupied', 'Available',
      'MonthlyRent', 'SecurityDeposit', 'Facilities', 'Status', 'LastUpdated'
    ];
    
    if (capacitySheet.getLastRow() === 0) {
      capacitySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = capacitySheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#ea4335');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      // Add sample hostel data
      const sampleData = [
        ['Block A', 'A101', 'Single Room', 1, 0, 1, 8000, 16000, 'AC, WiFi, Study Table', 'Available', new Date()],
        ['Block A', 'A102', 'Single Room', 1, 0, 1, 8000, 16000, 'AC, WiFi, Study Table', 'Available', new Date()],
        ['Block A', 'A201', 'Double Room', 2, 0, 2, 6000, 12000, 'AC, WiFi, Study Table', 'Available', new Date()],
        ['Block A', 'A202', 'Double Room', 2, 0, 2, 6000, 12000, 'AC, WiFi, Study Table', 'Available', new Date()],
        ['Block B', 'B101', 'Triple Room', 3, 0, 3, 4000, 8000, 'Fan, WiFi, Study Table', 'Available', new Date()],
        ['Block B', 'B102', 'Triple Room', 3, 0, 3, 4000, 8000, 'Fan, WiFi, Study Table', 'Available', new Date()],
        ['Block C', 'C101', 'Dormitory', 8, 0, 8, 2000, 4000, 'Fan, Common Study Hall', 'Available', new Date()],
        ['Block C', 'C102', 'Dormitory', 8, 0, 8, 2000, 4000, 'Fan, Common Study Hall', 'Available', new Date()]
      ];
      
      capacitySheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
      
      // Set column widths
      capacitySheet.setColumnWidth(1, 100); // HostelBlock
      capacitySheet.setColumnWidth(2, 100); // RoomNumber
      capacitySheet.setColumnWidth(3, 120); // RoomType
      capacitySheet.setColumnWidth(4, 80);  // Capacity
      capacitySheet.setColumnWidth(5, 80);  // Occupied
      capacitySheet.setColumnWidth(6, 80);  // Available
      capacitySheet.setColumnWidth(7, 100); // MonthlyRent
      capacitySheet.setColumnWidth(8, 120); // SecurityDeposit
      capacitySheet.setColumnWidth(9, 200); // Facilities
      capacitySheet.setColumnWidth(10, 100); // Status
      capacitySheet.setColumnWidth(11, 120); // LastUpdated
      
      // Freeze header row
      capacitySheet.setFrozenRows(1);
    }
    
    Logger.log('Hostel capacity initialized successfully');
    
  } catch (error) {
    Logger.log('Error initializing hostel capacity: ' + error.toString());
  }
}

/**
 * Process hostel allocation request
 */
function processHostelAllocation(studentId, preferences) {
  try {
    const spreadsheet = SpreadsheetApp.openById(HOSTEL_CONFIG.SPREADSHEET_ID);
    const studentSheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.STUDENT_SHEET_NAME);
    const hostelSheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.HOSTEL_SHEET_NAME);
    const capacitySheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.ROOM_CAPACITY_SHEET_NAME);
    
    // Get student data
    const studentData = getStudentData(studentSheet, studentId);
    if (!studentData) {
      throw new Error('Student not found: ' + studentId);
    }
    
    // Check if student already has hostel allocation
    if (studentData.hostelAllocation && studentData.hostelAllocation !== '') {
      throw new Error('Student already has hostel allocation');
    }
    
    // Find suitable room
    const availableRoom = findAvailableRoom(capacitySheet, preferences);
    if (!availableRoom) {
      throw new Error('No suitable room available');
    }
    
    // Generate hostel ID
    const hostelId = 'HST' + Date.now();
    
    // Create hostel allocation record
    const allocationData = [
      hostelId,
      studentId,
      studentData.firstName + ' ' + studentData.lastName,
      studentData.course,
      preferences.hostelType || availableRoom.roomType,
      availableRoom.roomNumber,
      '', // Bed number - will be assigned
      preferences.specialRequirements || '',
      'Allocated',
      new Date(),
      '', // Check-in date
      '', // Check-out date
      availableRoom.monthlyRent,
      availableRoom.securityDeposit,
      'Pending',
      'Hostel allocated based on preferences',
      new Date(),
      new Date()
    ];
    
    // Add to hostel management sheet
    hostelSheet.appendRow(allocationData);
    
    // Update room capacity
    updateRoomCapacity(capacitySheet, availableRoom.roomNumber, 1);
    
    // Update student database
    updateStudentHostelAllocation(studentSheet, studentId, availableRoom.roomNumber);
    
    // Send allocation notification
    sendHostelAllocationNotification(studentData, availableRoom, hostelId);
    
    Logger.log('Hostel allocated successfully for student: ' + studentId);
    return {
      success: true,
      hostelId: hostelId,
      roomNumber: availableRoom.roomNumber,
      monthlyRent: availableRoom.monthlyRent,
      securityDeposit: availableRoom.securityDeposit
    };
    
  } catch (error) {
    Logger.log('Error processing hostel allocation: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Find available room based on preferences
 */
function findAvailableRoom(capacitySheet, preferences) {
  const data = capacitySheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const roomData = {};
    headers.forEach((header, index) => {
      roomData[header.toLowerCase().replace(/\s+/g, '')] = row[index];
    });
    
    // Check if room is available
    if (roomData.available > 0 && roomData.status === 'Available') {
      // Check if room type matches preference
      if (!preferences.hostelType || roomData.roomtype === preferences.hostelType) {
        return {
          roomNumber: roomData.roomnumber,
          roomType: roomData.roomtype,
          monthlyRent: roomData.monthlyrent,
          securityDeposit: roomData.securitydeposit,
          facilities: roomData.facilities
        };
      }
    }
  }
  
  return null;
}

/**
 * Update room capacity
 */
function updateRoomCapacity(capacitySheet, roomNumber, change) {
  const data = capacitySheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === roomNumber) { // Room number is in column 2
      const currentOccupied = data[i][4]; // Occupied is in column 5
      const currentAvailable = data[i][5]; // Available is in column 6
      const capacity = data[i][3]; // Capacity is in column 4
      
      const newOccupied = currentOccupied + change;
      const newAvailable = capacity - newOccupied;
      
      // Update occupied count
      capacitySheet.getRange(i + 1, 5).setValue(newOccupied);
      // Update available count
      capacitySheet.getRange(i + 1, 6).setValue(newAvailable);
      // Update status
      capacitySheet.getRange(i + 1, 10).setValue(newAvailable > 0 ? 'Available' : 'Full');
      // Update last updated
      capacitySheet.getRange(i + 1, 11).setValue(new Date());
      
      break;
    }
  }
}

/**
 * Process hostel check-in
 */
function processHostelCheckIn(studentId, checkInDate) {
  try {
    const spreadsheet = SpreadsheetApp.openById(HOSTEL_CONFIG.SPREADSHEET_ID);
    const hostelSheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.HOSTEL_SHEET_NAME);
    
    // Find hostel record
    const hostelRecord = findHostelRecord(hostelSheet, studentId);
    if (!hostelRecord) {
      throw new Error('Hostel record not found for student: ' + studentId);
    }
    
    if (hostelRecord.allocationstatus !== 'Allocated') {
      throw new Error('Student is not allocated to hostel');
    }
    
    // Update check-in date
    const rowIndex = hostelRecord.rowIndex;
    hostelSheet.getRange(rowIndex, 11).setValue(checkInDate); // Check-in date
    hostelSheet.getRange(rowIndex, 9).setValue('Checked In'); // Allocation status
    hostelSheet.getRange(rowIndex, 18).setValue(new Date()); // Updated at
    
    // Send check-in notification
    sendCheckInNotification(hostelRecord, checkInDate);
    
    Logger.log('Check-in processed for student: ' + studentId);
    return {
      success: true,
      message: 'Check-in completed successfully'
    };
    
  } catch (error) {
    Logger.log('Error processing check-in: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Process hostel check-out
 */
function processHostelCheckOut(studentId, checkOutDate, reason) {
  try {
    const spreadsheet = SpreadsheetApp.openById(HOSTEL_CONFIG.SPREADSHEET_ID);
    const hostelSheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.HOSTEL_SHEET_NAME);
    const capacitySheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.ROOM_CAPACITY_SHEET_NAME);
    
    // Find hostel record
    const hostelRecord = findHostelRecord(hostelSheet, studentId);
    if (!hostelRecord) {
      throw new Error('Hostel record not found for student: ' + studentId);
    }
    
    // Update check-out date and status
    const rowIndex = hostelRecord.rowIndex;
    hostelSheet.getRange(rowIndex, 12).setValue(checkOutDate); // Check-out date
    hostelSheet.getRange(rowIndex, 9).setValue('Vacated'); // Allocation status
    hostelSheet.getRange(rowIndex, 16).setValue(reason || 'Student check-out'); // Notes
    hostelSheet.getRange(rowIndex, 18).setValue(new Date()); // Updated at
    
    // Update room capacity
    updateRoomCapacity(capacitySheet, hostelRecord.roomnumber, -1);
    
    // Update student database
    updateStudentHostelAllocation(spreadsheet.getSheetByName(HOSTEL_CONFIG.STUDENT_SHEET_NAME), 
                                  studentId, 'Vacated');
    
    // Send check-out notification
    sendCheckOutNotification(hostelRecord, checkOutDate, reason);
    
    Logger.log('Check-out processed for student: ' + studentId);
    return {
      success: true,
      message: 'Check-out completed successfully'
    };
    
  } catch (error) {
    Logger.log('Error processing check-out: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get hostel occupancy statistics
 */
function getHostelOccupancyStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(HOSTEL_CONFIG.SPREADSHEET_ID);
    const capacitySheet = spreadsheet.getSheetByName(HOSTEL_CONFIG.ROOM_CAPACITY_SHEET_NAME);
    
    const data = capacitySheet.getDataRange().getValues();
    
    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalAvailable = 0;
    const blockStats = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const capacity = row[3];
      const occupied = row[4];
      const available = row[5];
      const block = row[0];
      
      totalCapacity += capacity;
      totalOccupied += occupied;
      totalAvailable += available;
      
      if (!blockStats[block]) {
        blockStats[block] = {
          capacity: 0,
          occupied: 0,
          available: 0
        };
      }
      
      blockStats[block].capacity += capacity;
      blockStats[block].occupied += occupied;
      blockStats[block].available += available;
    }
    
    const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
    
    return {
      totalCapacity: totalCapacity,
      totalOccupied: totalOccupied,
      totalAvailable: totalAvailable,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      blockStats: blockStats
    };
    
  } catch (error) {
    Logger.log('Error getting occupancy stats: ' + error.toString());
    return null;
  }
}

/**
 * Send hostel allocation notification
 */
function sendHostelAllocationNotification(studentData, roomData, hostelId) {
  try {
    const subject = `Hostel Allocation Confirmed - ${studentData.studentId}`;
    const body = `
Dear ${studentData.firstName} ${studentData.lastName},

Congratulations! Your hostel allocation has been confirmed.

Allocation Details:
- Student ID: ${studentData.studentId}
- Hostel ID: ${hostelId}
- Room Number: ${roomData.roomNumber}
- Room Type: ${roomData.roomType}
- Monthly Rent: ₹${roomData.monthlyRent}
- Security Deposit: ₹${roomData.securityDeposit}
- Facilities: ${roomData.facilities}

Next Steps:
1. Complete your fee payment (if not already done)
2. Visit the hostel office to complete check-in formalities
3. Bring your Student ID and fee payment receipt
4. Check-in date will be communicated separately

Important Notes:
- Hostel allocation is subject to payment of hostel fees
- Security deposit must be paid at the time of check-in
- Hostel rules and regulations will be provided during check-in

If you have any questions, please contact the hostel warden.

Best regards,
Hostel Management Team
Educational Institution
    `;
    
    GmailApp.sendEmail(studentData.email, subject, body);
    
  } catch (error) {
    Logger.log('Error sending allocation notification: ' + error.toString());
  }
}

/**
 * Send check-in notification
 */
function sendCheckInNotification(hostelRecord, checkInDate) {
  try {
    const subject = `Hostel Check-in Confirmed - ${hostelRecord.studentid}`;
    const body = `
Dear ${hostelRecord.studentname},

Your hostel check-in has been confirmed.

Check-in Details:
- Student ID: ${hostelRecord.studentid}
- Hostel ID: ${hostelRecord.hostelid}
- Room Number: ${hostelRecord.roomnumber}
- Check-in Date: ${new Date(checkInDate).toLocaleDateString()}

Welcome to the hostel! Please ensure you follow all hostel rules and regulations.

For any hostel-related queries, contact the hostel warden.

Best regards,
Hostel Management Team
Educational Institution
    `;
    
    // Note: Email would be sent to student's email from student database
    Logger.log('Check-in notification sent');
    
  } catch (error) {
    Logger.log('Error sending check-in notification: ' + error.toString());
  }
}

/**
 * Send check-out notification
 */
function sendCheckOutNotification(hostelRecord, checkOutDate, reason) {
  try {
    const subject = `Hostel Check-out Confirmed - ${hostelRecord.studentid}`;
    const body = `
Dear ${hostelRecord.studentname},

Your hostel check-out has been confirmed.

Check-out Details:
- Student ID: ${hostelRecord.studentid}
- Hostel ID: ${hostelRecord.hostelid}
- Room Number: ${hostelRecord.roomnumber}
- Check-out Date: ${new Date(checkOutDate).toLocaleDateString()}
- Reason: ${reason || 'Student check-out'}

Security deposit refund will be processed as per institutional policy.

Thank you for staying with us!

Best regards,
Hostel Management Team
Educational Institution
    `;
    
    Logger.log('Check-out notification sent');
    
  } catch (error) {
    Logger.log('Error sending check-out notification: ' + error.toString());
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

function findHostelRecord(hostelSheet, studentId) {
  const data = hostelSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === studentId) { // Student ID is in column 2
      const hostelRecord = {};
      headers.forEach((header, index) => {
        hostelRecord[header.toLowerCase().replace(/\s+/g, '')] = data[i][index];
      });
      hostelRecord.rowIndex = i + 1;
      return hostelRecord;
    }
  }
  return null;
}

function updateStudentHostelAllocation(studentSheet, studentId, allocation) {
  const data = studentSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === studentId) {
      const hostelAllocationColumn = 18; // Assuming hostel allocation is in column 18
      studentSheet.getRange(i + 1, hostelAllocationColumn).setValue(allocation);
      break;
    }
  }
}

/**
 * Web app endpoint for hostel management
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'allocateHostel':
        const allocationResult = processHostelAllocation(data.studentId, data.preferences);
        return ContentService
          .createTextOutput(JSON.stringify(allocationResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'checkIn':
        const checkInResult = processHostelCheckIn(data.studentId, data.checkInDate);
        return ContentService
          .createTextOutput(JSON.stringify(checkInResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'checkOut':
        const checkOutResult = processHostelCheckOut(data.studentId, data.checkOutDate, data.reason);
        return ContentService
          .createTextOutput(JSON.stringify(checkOutResult))
          .setMimeType(ContentService.MimeType.JSON);
          
      case 'getOccupancyStats':
        const stats = getHostelOccupancyStats();
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
 * Scheduled function to update occupancy statistics
 */
function updateOccupancyStats() {
  try {
    const stats = getHostelOccupancyStats();
    if (stats) {
      // Update dashboard or send reports
      Logger.log('Occupancy Stats Updated: ' + JSON.stringify(stats));
    }
  } catch (error) {
    Logger.log('Error updating occupancy stats: ' + error.toString());
  }
}