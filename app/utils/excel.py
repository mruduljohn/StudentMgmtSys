import pandas as pd
from sqlalchemy.orm import Session
from ..models.student import Student

def upload_students(file_path: str, db: Session):
    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        student = Student(
            serial_number=row["Sl No"],
            name=row["Name"],
            student_unique_id=row["Student ID"],
            phone_number=row["Ph num"],
            gender=row["gender"],
            batch_id=row["batch"],
            mentor_id=row["class teacher"],
            is_hostel_student=row["hostel"],
            stream_id=row["stream"],
            program_id=row["program"],
            study_material_provided=row["study material"],
            uniform_provided=row["uniform"],
            id_card_provided=row["ID Card"],
            tab_provided=row["Tab"],
            syllabus_provided=row["SYllabus"],
            plus_two_percentage=row["Percentage of +2 marks"],
            neet_score=row["NEET Score"],
            remarks=row["Remarks"],
            fee_due=row["Fee Due"],
        )
        db.add(student)
    db.commit()
