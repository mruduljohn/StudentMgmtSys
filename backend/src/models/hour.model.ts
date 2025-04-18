import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  code: { type: String },
  name: { type: String }
}, { _id: false });

const hourSchema = new mongoose.Schema({
  batch: { 
    type: String, 
    required: true,
    index: true
  },
  subject: { 
    type: String, 
    required: true,
    index: true
  },
  chapter: { 
    type: String, 
    required: true 
  },
  mode: { 
    type: String, 
    required: true 
  },
  faculties: [facultySchema],
  examDate: { 
    type: Date,
    default: null
  },
  allotedHours: { 
    type: Number, 
    required: true,
    default: 0
  },
  completedHours: { 
    type: Number, 
    required: true,
    default: 0
  },
  code: { 
    type: String 
  },
  name: { 
    type: String 
  },
  classTeacher: { 
    type: String, 
    required: true 
  },
  chapterStatus: { 
    type: String, 
    enum: ["NOT STARTED", "ONGOING", "COMPLETED"],
    default: "NOT STARTED"
  },
  averageMarksOfBatch: { 
    type: Number,
    default: 0
  },
  numberOfAPlus: { 
    type: Number,
    default: 0
  },
  remarks1: { 
    type: String 
  },
  remarks2: { 
    type: String 
  },
  remarks3: { 
    type: String 
  },
  flag1: { 
    type: String 
  },
  flag2: { 
    type: String 
  },
  remainingHoursNeeded: { 
    type: Number,
    default: function(this: any) {
      return Math.max(0, this.allotedHours - this.completedHours);
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Explicitly handle examDate field
      if (doc.examDate instanceof Date && !isNaN(doc.examDate.getTime())) {
        ret.examDate = doc.examDate;
      }
      
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Explicitly handle examDate field
      if (doc.examDate instanceof Date && !isNaN(doc.examDate.getTime())) {
        ret.examDate = doc.examDate;
      }
      
      return ret;
    }
  }
});

// Virtual for calculating remaining hours
hourSchema.virtual('remainingHours').get(function() {
  return Math.max(0, this.allotedHours - this.completedHours);
});

// Add compound index for batch and subject for faster queries
hourSchema.index({ batch: 1, subject: 1 });

export default mongoose.model("Hour", hourSchema); 