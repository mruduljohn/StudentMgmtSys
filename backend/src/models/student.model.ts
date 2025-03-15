import mongoose from "mongoose";

// Custom boolean schema type with better handling of empty strings
const BooleanWithEmptyStringSupport = {
  type: Boolean,
  default: false,
  get: (v: boolean) => v,
  set: (v: any) => {
    if (v === undefined || v === null || v === '') {
      return false;
    }
    if (typeof v === 'string') {
      return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
    }
    return Boolean(v);
  }
};

// Custom enum type with empty string support
const createEnumWithEmptySupport = (values: string[], defaultValue: string) => ({
  type: String,
  enum: [...values, ''],
  set: (v: any) => {
    if (v === undefined || v === null || v === '') {
      return defaultValue;
    }
    return v;
  }
});

const studentSchema = new mongoose.Schema(
  {
    slNo: { type: Number },
    name: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    gender: { type: String, enum: ["M", "F", "DIFFERENT"] },
    batch: { type: String },
    classTeacher: { type: String },
    hostel: { type: String },
    stream: { type: String },
    program: { type: String },
    studyMaterial: createEnumWithEmptySupport(
      ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"],
      "NOT RECEIVED"
    ),
    uniform: createEnumWithEmptySupport(
      ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"],
      "NOT RECEIVED"
    ),
    idCard: createEnumWithEmptySupport(
      ["NOT RECEIVED", "RECEIVED"],
      "NOT RECEIVED"
    ),
    tab: createEnumWithEmptySupport(
      ["REQUESTED NOT PAID", "RECEIVED PAID", "RECEIVED NOT PAID", "REQUESTED PAID", "PERSONAL TAB", "NOT REQUIRED"],
      "NOT REQUIRED"
    ),
    joined: { 
      type: String, 
      enum: ["ALLOTED", "DISCONTINUED", "JOINED", "NOT JOINING", "CENTRE CHANGE"],
      default: "ALLOTED"
    },
    syllabus: { type: String },
    percentageOfPlus2Marks: { type: Number },
    neetScore: { type: Number },
    remarks: { type: String },
    remarks1: { type: String },
    remarks2: { type: String },
    remarks3: { type: String },
    remarks4: { type: String },
    feeDue: { type: Number, default: 0 },
    flag1: BooleanWithEmptyStringSupport,
    flag2: BooleanWithEmptyStringSupport,
    flag3: BooleanWithEmptyStringSupport,
    flag4: BooleanWithEmptyStringSupport,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Student", studentSchema);
