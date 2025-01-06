# app/main.py
from fastapi import FastAPI
from .database import engine
from .models import user, student
from dotenv import load_dotenv
import os

load_dotenv()

# Create all tables
user.Base.metadata.create_all(bind=engine)
student.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tuition Management System")

@app.get("/")
async def root():
    return {"message": "Welcome to Tuition Management System"}