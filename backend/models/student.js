const pool = require('./db');

const getStudents = async () => {
    return pool.query('SELECT * FROM students');
};

const getStudentById = async (id) => {
    return pool.query('SELECT * FROM students WHERE id = $1', [id]);
};

const createStudent = async (studentData) => {
    return pool.query(
        'INSERT INTO students (name, student_id, phone_number, gender, batch, class_teacher, hostel, stream, program, study_material, uniform, id_card, tab, joined_status, syllabus, plus_two_percentage, neet_score, remarks, remarks1, remarks2, remarks3, remarks4, fee_due, flag1, flag2, flag3, flag4, created_by, modified_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29) RETURNING *',
        [
            studentData.name,
            studentData.student_id,
            studentData.phone_number,
            studentData.gender,
            studentData.batch,
            studentData.class_teacher,
            studentData.hostel,
            studentData.stream,
            studentData.program,
            studentData.study_material,
            studentData.uniform,
            studentData.id_card,
            studentData.tab,
            studentData.joined_status,
            studentData.syllabus,
            studentData.plus_two_percentage,
            studentData.neet_score,
            studentData.remarks,
            studentData.remarks1,
            studentData.remarks2,
            studentData.remarks3,
            studentData.remarks4,
            studentData.fee_due,
            studentData.flag1,
            studentData.flag2,
            studentData.flag3,
            studentData.flag4,
            studentData.created_by,
            studentData.modified_by,
        ]
    );
};

const updateStudent = async (id, studentData, req) => {
    return pool.query(
        'UPDATE students SET name = $1, student_id = $2, phone_number = $3, gender = $4, batch = $5, class_teacher = $6, hostel = $7, stream = $8, program = $9, study_material = $10, uniform = $11, id_card = $12, tab = $13, joined_status = $14, syllabus = $15, plus_two_percentage = $16, neet_score = $17, remarks = $18, remarks1 = $19, remarks2 = $20, remarks3 = $21, remarks4 = $22, fee_due = $23, flag1 = $24, flag2 = $25, flag3 = $26, flag4 = $27, modified_at = CURRENT_TIMESTAMP, modified_by = $28 WHERE id = $29 RETURNING *',
        [
            studentData.name,
            studentData.student_id,
            studentData.phone_number,
            studentData.gender,
            studentData.batch,
            studentData.class_teacher,
            studentData.hostel,
            studentData.stream,
            studentData.program,
            studentData.study_material,
            studentData.uniform,
            studentData.id_card,
            studentData.tab,
            studentData.joined_status,
            studentData.syllabus,
            studentData.plus_two_percentage,
            studentData.neet_score,
            studentData.remarks,
            studentData.remarks1,
            studentData.remarks2,
            studentData.remarks3,
            studentData.remarks4,
            studentData.fee_due,
            studentData.flag1,
            studentData.flag2,
            studentData.flag3,
            studentData.flag4,
            req.user.id, // Use req.user.id here
            id,
        ]
    );
};

const deleteStudent = async (id) => {
    return pool.query('DELETE FROM students WHERE id = $1', [id]);
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };