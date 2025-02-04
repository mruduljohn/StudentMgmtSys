const multer = require('multer');
const xlsx = require('xlsx');
const pool = require('../models/db');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        for (const row of data) {
            await pool.query(
                'INSERT INTO students (sl_no, name, student_id, phone_number, gender, batch, class_teacher, hostel, stream, program, study_material, uniform, id_card, tab, joined, syllabus, percentage_of_2_marks, neet_score, remarks, remarks_1, remarks_2, remarks_3, remarks_4, fee_due, flag1, flag2, flag3, flag4) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) ON CONFLICT (student_id) DO NOTHING',
                [
                    row.sl_no,
                    row.NAME,
                    row['STUDENT ID'],
                    row['PHONE NUMBER'],
                    row.GENDER,
                    row.BATCH,
                    row['CLASS TEACHER'],
                    row.HOSTEL,
                    row.STREAM,
                    row.PROGRAM,
                    row['Study Material'],
                    row.Uniform,
                    row['ID Card'],
                    row.Tab,
                    row.JOINED,
                    row.Syllabus,
                    row['Percentage of +2 Marks'],
                    row['NEET Score'],
                    row.Remarks,
                    row['Remarks 1'],
                    row['Remarks 2'],
                    row['Remarks 3'],
                    row['Remarks 4'],
                    row['Fee Due'],
                    row.Flag1,
                    row.Flag2,
                    row.Flag3,
                    row.Flag4,
                ]
            );
        }

        res.json({ message: 'Students imported successfully' });
    } catch (error) {
        console.error('Error importing students:', error);
        res.status(500).json({ message: error.message });
    }
};

const downloadExcel = async (req, res) => {
    try {
        const students = await pool.query('SELECT * FROM students');
        const data = students.rows;

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

        const excelBuffer = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'buffer',
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error exporting students:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadExcel, downloadExcel, upload };