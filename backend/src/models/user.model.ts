import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "MENTOR"], required: true },
  // For MENTOR role only
  assignedStudents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }],
  // For tracking changes made by this user
  activityLog: [{
    action: { type: String },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model("User", userSchema);
