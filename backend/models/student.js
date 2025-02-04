const pool = require('./db');

const getStudents = async () => {
    return pool.query('SELECT * FROM students');
};

const getStudentById = async (id) => {
    return pool.query('SELECT * FROM students WHERE id = $1', [id]);
};

const createStudent = async (studentData) => {
    return pool.query(
        'INSERT INTO students (sl_no, name, student_id, phone_number, gender, batch, class_teacher, hostel, stream, program, study_material, uniform, id_card, tab, joined, syllabus, percentage_of_2_marks, neet_score, remarks, remarks_1, remarks_2, remarks_3, remarks_4, fee_due, flag1, flag2, flag3, flag4) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING *',
        [
            studentData.sl_no,
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
            studentData.joined,
            studentData.syllabus,
            studentData.percentage_of_2_marks,
            studentData.neet_score,
            studentData.remarks,
            studentData.remarks_1,
            studentData.remarks_2,
            studentData.remarks_3,
            studentData.remarks_4,
            studentData.fee_due,
            studentData.flag1,
            studentData.flag2,
            studentData.flag3,
            studentData.flag4,
        ]
    );
};

const updateStudent = async (id, studentData) => {
    return pool.query(
        'UPDATE students SET sl_no = $1, name = $2, student_id = $3, phone_number = $4, gender = $5, batch = $6, class_teacher = $7, hostel = $8, stream = $9, program = $10, study_material = $11, uniform = $12, id_card = $13, tab = $14, joined = $15, syllabus = $16, percentage_of_2_marks = $17, neet_score = $18, remarks = $19, remarks_1 = $20, remarks_2 = $21, remarks_3 = $22, remarks_4 = $23, fee_due = $24, flag1 = $25, flag2 = $26, flag3 = $27, flag4 = $28 WHERE id = $29 RETURNING *',
        [
            studentData.sl_no,
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
            studentData.joined,
            studentData.syllabus,
            studentData.percentage_of_2_marks,
            studentData.neet_score,
            studentData.remarks,
            studentData.remarks_1,
            studentData.remarks_2,
            studentData.remarks_3,
            studentData.remarks_4,
            studentData.fee_due,
            studentData.flag1,
            studentData.flag2,
            studentData.flag3,
            studentData.flag4,
            id,
        ]
    );
};

const deleteStudent = async (id) => {
    return pool.query('DELETE FROM students WHERE id = $1', [id]);
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };