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
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
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
    batch VARCHAR(50) NOT NULL,
    class_teacher VARCHAR(100),
    hostel VARCHAR(100),
    stream VARCHAR(20) CHECK (stream IN ('MEDICAL', 'ENGINEERING', 'FOUNDATION')),
    program VARCHAR(50) NOT NULL,
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

-- Configurable options table for batch, teacher, hostel, and program
CREATE TABLE configurable_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    modified_by UUID REFERENCES users(id),
    UNIQUE (category, value, academic_year)
);

-- Create indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_batch ON students(batch);
CREATE INDEX idx_students_hostel ON students(hostel);
CREATE INDEX idx_students_stream ON students(stream);
CREATE INDEX idx_students_program ON students(program);
CREATE INDEX idx_configurable_options_category ON configurable_options(category, academic_year);

-- Add audit triggers
CREATE TRIGGER students_audit
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

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
    batch,
    COUNT(*) AS total_students,
    COUNT(CASE WHEN fee_due > 0 THEN 1 END) AS fee_due_count,
    COUNT(CASE WHEN study_material IS NOT NULL THEN 1 END) AS study_material_count,
    COUNT(CASE WHEN uniform IS NOT NULL THEN 1 END) AS uniform_count,
    COUNT(CASE WHEN id_card IS NOT NULL THEN 1 END) AS id_card_count,
    COUNT(CASE WHEN tab IS NOT NULL THEN 1 END) AS tab_count
FROM students
GROUP BY batch;

CREATE OR REPLACE VIEW hostel_statistics AS
SELECT 
    hostel,
    COUNT(*) AS current_occupancy
FROM students
WHERE hostel IS NOT NULL
GROUP BY hostel;

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

-- Populate initial class teachers
INSERT INTO configurable_options 
    (category, value, academic_year)
VALUES
    ('CLASS_TEACHER', 'TEACHER1', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER2', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER3', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER4', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER5', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER6', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER7', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER8', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER9', get_current_academic_year()),
    ('CLASS_TEACHER', 'TEACHER10', get_current_academic_year());

-- Populate initial hostels
INSERT INTO configurable_options 
    (category, value, academic_year)
VALUES
    ('HOSTEL', 'HOSTEL1', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL2', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL3', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL4', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL5', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL6', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL7', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL8', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL9', get_current_academic_year()),
    ('HOSTEL', 'HOSTEL10', get_current_academic_year());

-- Populate initial programs
INSERT INTO configurable_options 
    (category, value, academic_year)
VALUES
    ('PROGRAM', 'PROGRAM1', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM2', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM3', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM4', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM5', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM6', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM7', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM8', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM9', get_current_academic_year()),
    ('PROGRAM', 'PROGRAM10', get_current_academic_year());

-- Create helper functions for managing configurable options
-- Function to add new configurable option
CREATE OR REPLACE FUNCTION add_configurable_option(
    p_category VARCHAR,
    p_value VARCHAR,
    p_academic_year VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_academic_year VARCHAR;
    v_new_id UUID;
BEGIN
    IF p_academic_year IS NULL THEN
        v_academic_year := get_current_academic_year();
    ELSE
        v_academic_year := p_academic_year;
    END IF;
    INSERT INTO configurable_options (category, value, academic_year)
    VALUES (p_category, p_value, v_academic_year)
    RETURNING id INTO v_new_id;
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate configurable option
CREATE OR REPLACE FUNCTION deactivate_configurable_option(
    p_category VARCHAR,
    p_value VARCHAR,
    p_academic_year VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_academic_year VARCHAR;
BEGIN
    IF p_academic_year IS NULL THEN
        v_academic_year := get_current_academic_year();
    ELSE
        v_academic_year := p_academic_year;
    END IF;
    UPDATE configurable_options
    SET is_active = false,
        modified_at = CURRENT_TIMESTAMP
    WHERE category = p_category
    AND value = p_value
    AND academic_year = v_academic_year;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create views for easy access to active options
CREATE OR REPLACE VIEW active_teachers AS
SELECT value as teacher_name, created_at, modified_at
FROM configurable_options
WHERE category = 'CLASS_TEACHER'
AND is_active = true
AND academic_year = get_current_academic_year()
ORDER BY value;

CREATE OR REPLACE VIEW active_hostels AS
SELECT value as hostel_name, created_at, modified_at
FROM configurable_options
WHERE category = 'HOSTEL'
AND is_active = true
AND academic_year = get_current_academic_year()
ORDER BY value;

CREATE OR REPLACE VIEW active_programs AS
SELECT value as program_name, created_at, modified_at
FROM configurable_options
WHERE category = 'PROGRAM'
AND is_active = true
AND academic_year = get_current_academic_year()
ORDER BY value;

-- Example usage of helper functions:
-- SELECT add_configurable_option('CLASS_TEACHER', 'TEACHER11');
-- SELECT deactivate_configurable_option('CLASS_TEACHER', 'TEACHER1');