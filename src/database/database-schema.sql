-- Student Database Schema for Educational Institution ERP
-- This schema represents the structure that will be implemented in Google Sheets
-- Each table corresponds to a separate Google Sheet

-- Main Student Database Table
CREATE TABLE StudentDatabase (
    StudentID VARCHAR(20) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender ENUM('Male', 'Female', 'Other') NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    EmergencyContact VARCHAR(20) NOT NULL,
    Course VARCHAR(100) NOT NULL,
    AcademicYear VARCHAR(10) NOT NULL,
    PreviousEducation TEXT,
    HostelRequired ENUM('Yes', 'No') NOT NULL,
    HostelType VARCHAR(50),
    SpecialRequirements TEXT,
    SubmissionDate DATETIME NOT NULL,
    Status ENUM('Pending Review', 'Approved', 'Rejected', 'On Hold') DEFAULT 'Pending Review',
    FeeStatus ENUM('Pending', 'Paid', 'Partial', 'Overdue') DEFAULT 'Pending',
    HostelAllocation VARCHAR(100),
    ExaminationRecords TEXT,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fee Collection Table
CREATE TABLE FeeCollection (
    FeeID VARCHAR(20) PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    StudentName VARCHAR(100) NOT NULL,
    Course VARCHAR(100) NOT NULL,
    AcademicYear VARCHAR(10) NOT NULL,
    FeeAmount DECIMAL(10,2) NOT NULL,
    PaymentStatus ENUM('Pending', 'Paid', 'Partial', 'Overdue') DEFAULT 'Pending',
    PaymentDate DATETIME,
    PaymentMethod ENUM('Cash', 'Bank Transfer', 'Online', 'Cheque') NULL,
    TransactionID VARCHAR(100),
    ReceiptNumber VARCHAR(50),
    DueDate DATE,
    LateFee DECIMAL(10,2) DEFAULT 0.00,
    TotalAmount DECIMAL(10,2),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentID) REFERENCES StudentDatabase(StudentID)
);

-- Hostel Management Table
CREATE TABLE HostelManagement (
    HostelID VARCHAR(20) PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    StudentName VARCHAR(100) NOT NULL,
    Course VARCHAR(100) NOT NULL,
    HostelType VARCHAR(50) NOT NULL,
    RoomNumber VARCHAR(20),
    BedNumber VARCHAR(10),
    SpecialRequirements TEXT,
    AllocationStatus ENUM('Pending', 'Allocated', 'Rejected', 'Vacated') DEFAULT 'Pending',
    AllocationDate DATETIME,
    CheckInDate DATE,
    CheckOutDate DATE,
    MonthlyRent DECIMAL(10,2),
    SecurityDeposit DECIMAL(10,2),
    PaymentStatus ENUM('Pending', 'Paid', 'Partial', 'Overdue') DEFAULT 'Pending',
    Notes TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentID) REFERENCES StudentDatabase(StudentID)
);

-- Examination Records Table
CREATE TABLE ExaminationRecords (
    ExamID VARCHAR(20) PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    StudentName VARCHAR(100) NOT NULL,
    Course VARCHAR(100) NOT NULL,
    AcademicYear VARCHAR(10) NOT NULL,
    Semester VARCHAR(20) NOT NULL,
    Subject VARCHAR(100) NOT NULL,
    ExamType ENUM('Midterm', 'Final', 'Assignment', 'Project', 'Practical') NOT NULL,
    MarksObtained DECIMAL(5,2),
    TotalMarks DECIMAL(5,2),
    Grade VARCHAR(5),
    GradePoint DECIMAL(3,2),
    ExamDate DATE,
    ResultStatus ENUM('Pass', 'Fail', 'Absent', 'Pending') DEFAULT 'Pending',
    Remarks TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentID) REFERENCES StudentDatabase(StudentID)
);

-- User Access Control Table
CREATE TABLE UserAccess (
    UserID VARCHAR(20) PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Role ENUM('Admin', 'Admissions', 'Finance', 'Hostel', 'Examination', 'Faculty', 'Student') NOT NULL,
    Department VARCHAR(100),
    Permissions TEXT, -- JSON string of permissions
    IsActive BOOLEAN DEFAULT TRUE,
    LastLogin DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE AuditLog (
    LogID VARCHAR(20) PRIMARY KEY,
    UserID VARCHAR(20),
    Action VARCHAR(100) NOT NULL,
    TableName VARCHAR(50) NOT NULL,
    RecordID VARCHAR(20) NOT NULL,
    OldValues TEXT, -- JSON string
    NewValues TEXT, -- JSON string
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserAccess(UserID)
);

-- Notification System Table
CREATE TABLE Notifications (
    NotificationID VARCHAR(20) PRIMARY KEY,
    RecipientEmail VARCHAR(100) NOT NULL,
    Subject VARCHAR(200) NOT NULL,
    Message TEXT NOT NULL,
    NotificationType ENUM('Email', 'SMS', 'InApp') DEFAULT 'Email',
    Status ENUM('Pending', 'Sent', 'Failed', 'Delivered') DEFAULT 'Pending',
    ScheduledAt DATETIME,
    SentAt DATETIME,
    RetryCount INT DEFAULT 0,
    ErrorMessage TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration Table
CREATE TABLE SystemConfig (
    ConfigID VARCHAR(20) PRIMARY KEY,
    ConfigKey VARCHAR(100) UNIQUE NOT NULL,
    ConfigValue TEXT NOT NULL,
    Description TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_student_email ON StudentDatabase(Email);
CREATE INDEX idx_student_course ON StudentDatabase(Course);
CREATE INDEX idx_student_status ON StudentDatabase(Status);
CREATE INDEX idx_fee_student ON FeeCollection(StudentID);
CREATE INDEX idx_fee_status ON FeeCollection(PaymentStatus);
CREATE INDEX idx_hostel_student ON HostelManagement(StudentID);
CREATE INDEX idx_hostel_status ON HostelManagement(AllocationStatus);
CREATE INDEX idx_exam_student ON ExaminationRecords(StudentID);
CREATE INDEX idx_exam_course ON ExaminationRecords(Course);
CREATE INDEX idx_audit_timestamp ON AuditLog(Timestamp);
CREATE INDEX idx_notifications_status ON Notifications(Status);