-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        modified_by
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        CURRENT_USER
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    modified_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MENTOR')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Dynamic header configurations for remarks and flags
CREATE TABLE dynamic_headers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name VARCHAR(50) NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Main students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sl_no SERIAL,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    phone_number VARCHAR(20) CHECK (phone_number ~ '^[0-9+]+$'),
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'DIFFERENT')),
    batch_id UUID,
    hostel_id UUID,
    stream VARCHAR(20) CHECK (stream IN ('MEDICAL', 'ENGINEERING', 'FOUNDATION')),
    program_id UUID,
    study_material TEXT,
    uniform TEXT,
    id_card TEXT,
    tab TEXT,
    joined_status VARCHAR(20) CHECK (joined_status IN ('ALLOTED', 'JOINING SOON', 'JOINED', 'NOT JOINING', 'VACATED')),
    syllabus VARCHAR(20) CHECK (syllabus IN ('STATE', 'CBSE', 'ICSC', 'OTHERS')),
    plus_two_percentage DECIMAL(5,2) CHECK (plus_two_percentage >= 0 AND plus_two_percentage <= 100),
    neet_score INTEGER CHECK (neet_score >= 0 AND neet_score <= 720),
    remarks TEXT,
    remarks1 TEXT,
    remarks2 TEXT,
    remarks3 TEXT,
    remarks4 TEXT,
    fee_due DECIMAL(10,2) CHECK (fee_due >= 0),
    flag1 BOOLEAN,
    flag2 BOOLEAN,
    flag3 BOOLEAN,
    flag4 BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(20) UNIQUE NOT NULL,
    strength INT,
    stream VARCHAR(20) CHECK (stream IN ('MEDICAL', 'ENGINEERING', 'FOUNDATION')),
    program_id UUID,
    class_teacher VARCHAR(100),
    fee_due_count INT DEFAULT 0,
    study_material_due INT DEFAULT 0,
    id_card_due INT DEFAULT 0,
    uniform_due INT DEFAULT 0,
    tab_due INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Hostels table
CREATE TABLE hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_name VARCHAR(100) UNIQUE NOT NULL,
    capacity INT,
    filled_count INT DEFAULT 0,
    vacancy INT GENERATED ALWAYS AS (capacity - filled_count) STORED,
    gender_type VARCHAR(20) CHECK (gender_type IN ('BOYS', 'GIRLS')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Programs table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id)
);

-- Foreign key constraints
ALTER TABLE students ADD CONSTRAINT fk_batch FOREIGN KEY (batch_id) REFERENCES batches(id);
ALTER TABLE students ADD CONSTRAINT fk_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id);
ALTER TABLE students ADD CONSTRAINT fk_program FOREIGN KEY (program_id) REFERENCES programs(id);

-- Insert initial dynamic headers
INSERT INTO dynamic_headers (field_name, display_name) VALUES
('remarks', 'Remarks'),
('remarks1', 'Remarks 1'),
('remarks2', 'Remarks 2'),
('remarks3', 'Remarks 3'),
('remarks4', 'Remarks 4'),
('flag1', 'Flag 1'),
('flag2', 'Flag 2'),
('flag3', 'Flag 3'),
('flag4', 'Flag 4');

-- Create views for statistics
CREATE OR REPLACE VIEW batch_statistics AS
SELECT 
    b.batch_id,
    b.strength,
    b.stream,
    p.program_name,
    b.class_teacher,
    b.fee_due_count,
    b.study_material_due,
    b.id_card_due,
    b.uniform_due,
    b.tab_due
FROM batches b
LEFT JOIN programs p ON b.program_id = p.id;

CREATE OR REPLACE VIEW hostel_statistics AS
SELECT 
    h.hostel_name,
    h.capacity,
    h.filled_count,
    h.vacancy,
    h.gender_type
FROM hostels h;

-- Function to validate student data
CREATE OR REPLACE FUNCTION validate_student_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if student_id already exists
    IF TG_OP = 'INSERT' AND EXISTS (
        SELECT 1 FROM students WHERE student_id = NEW.student_id
    ) THEN
        RAISE EXCEPTION 'Student ID % already exists', NEW.student_id;
    END IF;

    -- Validate phone number format
    IF NEW.phone_number !~ '^[0-9+]+$' THEN
        RAISE EXCEPTION 'Invalid phone number format';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
CREATE TRIGGER validate_student_data_trigger
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION validate_student_data();

-- Function to get current academic year
CREATE OR REPLACE FUNCTION get_current_academic_year()
RETURNS VARCHAR AS $$
DECLARE
    current_month INTEGER;
    current_year INTEGER;
BEGIN
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    IF current_month >= 6 THEN
        RETURN current_year || '-' || (current_year + 1);
    ELSE
        RETURN (current_year - 1) || '-' || current_year;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Populate initial class teachers, hostels, and programs
INSERT INTO programs (program_name)
VALUES
('PROGRAM1'),
('PROGRAM2'),
('PROGRAM3'),
('PROGRAM4'),
('PROGRAM5'),
('PROGRAM6'),
('PROGRAM7'),
('PROGRAM8'),
('PROGRAM9'),
('PROGRAM10');

INSERT INTO hostels (hostel_name, capacity, gender_type)
VALUES
('HOSTEL1', 100, 'BOYS'),
('HOSTEL2', 100, 'GIRLS'),
('HOSTEL3', 100, 'BOYS'),
('HOSTEL4', 100, 'GIRLS'),
('HOSTEL5', 100, 'BOYS'),
('HOSTEL6', 100, 'GIRLS'),
('HOSTEL7', 100, 'BOYS'),
('HOSTEL8', 100, 'GIRLS'),
('HOSTEL9', 100, 'BOYS'),
('HOSTEL10', 100, 'GIRLS');

INSERT INTO batches (batch_id, strength, stream, program_id, class_teacher)
SELECT
    'BATCH01',
    50,
    'MEDICAL',
    p.id,
    'TEACHER1'
FROM programs p
WHERE p.program_name = 'PROGRAM1';

INSERT INTO batches (batch_id, strength, stream, program_id, class_teacher)
SELECT
    'BATCH02',
    50,
    'ENGINEERING',
    p.id,
    'TEACHER2'
FROM programs p
WHERE p.program_name = 'PROGRAM2';

-- Add audit triggers
CREATE TRIGGER students_audit
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_hostel_id ON students(hostel_id);
CREATE INDEX idx_students_program_id ON students(program_id);
CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_hostels_hostel_name ON hostels(hostel_name);
CREATE INDEX idx_programs_program_name ON programs(program_name);