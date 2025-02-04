CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    sl_no INT,
    name VARCHAR(255),
    student_id VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(255),
    gender VARCHAR(50),
    batch VARCHAR(50),
    class_teacher VARCHAR(50),
    hostel VARCHAR(50),
    stream VARCHAR(50),
    program VARCHAR(50),
    study_material TEXT,
    uniform TEXT,
    id_card TEXT,
    tab TEXT,
    joined VARCHAR(50),
    syllabus VARCHAR(50),
    percentage_of_2_marks NUMERIC CHECK (percentage_of_2_marks <= 100),
    neet_score NUMERIC CHECK (neet_score <= 720),
    remarks TEXT,
    remarks_1 TEXT,
    remarks_2 TEXT,
    remarks_3 TEXT,
    remarks_4 TEXT,
    fee_due NUMERIC,
    flag1 TEXT,
    flag2 TEXT,
    flag3 TEXT,
    flag4 TEXT
);