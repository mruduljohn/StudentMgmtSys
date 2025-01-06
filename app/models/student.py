# app/models/student.py
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from ..database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    
    attendance_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.mentor_id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String, nullable=False)  # "Present", "Absent", or "Late"

class Grade(Base):
    __tablename__ = "grades"
    
    grade_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.mentor_id"), nullable=False)
    subject = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    remarks = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Batch(Base):
    __tablename__ = "batches"
    
    batch_id = Column(Integer, primary_key=True, index=True)
    batch_name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Stream(Base):
    __tablename__ = "streams"
    
    stream_id = Column(Integer, primary_key=True, index=True)
    stream_name = Column(String, nullable=False)
    description = Column(String)

class Program(Base):
    __tablename__ = "programs"
    
    program_id = Column(Integer, primary_key=True, index=True)
    program_name = Column(String, nullable=False)
    description = Column(String)

class Student(Base):
    __tablename__ = "students"
    
    student_id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    student_unique_id = Column(String, unique=True, nullable=False, index=True)
    phone_number = Column(String)
    gender = Column(String)
    batch_id = Column(Integer, ForeignKey("batches.batch_id"))
    mentor_id = Column(Integer, ForeignKey("mentors.mentor_id"))
    is_hostel_student = Column(Boolean, default=False)
    stream_id = Column(Integer, ForeignKey("streams.stream_id"))
    program_id = Column(Integer, ForeignKey("programs.program_id"))
    
    # Materials and Resources
    study_material_provided = Column(Boolean, default=False)
    uniform_provided = Column(Boolean, default=False)
    id_card_provided = Column(Boolean, default=False)
    tab_provided = Column(Boolean, default=False)
    syllabus_provided = Column(Boolean, default=False)
    
    # Academic Details
    joining_date = Column(DateTime(timezone=True))
    plus_two_percentage = Column(Float)
    neet_score = Column(Integer)
    
    # Remarks
    remarks = Column(String)
    remarks_1 = Column(String)
    remarks_2 = Column(String)
    remarks_3 = Column(String)
    remarks_4 = Column(String)
    
    # Financial
    fee_due = Column(Float, default=0.0)
    
    # Flags
    flag1 = Column(Boolean, default=False)
    flag2 = Column(Boolean, default=False)
    flag3 = Column(Boolean, default=False)
    flag4 = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.user_id"))
    last_modified_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_modified_by = Column(Integer, ForeignKey("users.user_id"))