import mongoose, { Document, Schema } from "mongoose";

// Define a type for configuration categories
enum ConfigCategory {
  BATCHES = "batches",
  CLASS_TEACHERS = "classTeachers",
  HOSTELS = "hostels",
  STREAMS = "streams",
  PROGRAMS = "programs",
  STUDY_MATERIALS = "studyMaterials",
  UNIFORMS = "uniforms",
  ID_CARDS = "idCards",
  TABS = "tabs",
  JOINED_STATUSES = "joinedStatuses",
  SYLLABUSES = "syllabuses",
  SUBJECT_CHAPTERS = "subjectChapters",
  REMARKS = "remarks",
  REMARKS1 = "remarks1",
  REMARKS2 = "remarks2",
  REMARKS3 = "remarks3",
  REMARKS4 = "remarks4",
  FLAG1 = "flag1",
  FLAG2 = "flag2",
  FLAG3 = "flag3",
  FLAG4 = "flag4",
  DASHBOARD_PDFS = "dashboard-pdfs"
}

// Interface for PDF document in dashboard
interface PDFDocument {
  title: string;
  filePath: string;
  description?: string;
  uploadedAt?: Date;
}

// Define the interface for Config document
interface IConfig extends Document {
  category: string;
  values: string[];
  subjectChapters?: Map<string, string[]>;
  dashboardPDFs?: PDFDocument[];
  lastUpdatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const configSchema = new Schema<IConfig>(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(ConfigCategory),
    },
    values: {
      type: [String],
      default: [],
    },
    subjectChapters: {
      type: Map,
      of: [String],
      default: null,
    },
    dashboardPDFs: [{
      title: {
        type: String,
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Add a pre-save hook to log the document
configSchema.pre('save', function(next) {
  console.log('Saving config document:', this.category);
  console.log('With dashboardPDFs:', JSON.stringify(this.dashboardPDFs));
  next();
});

// Create and export the model
const Config = mongoose.model<IConfig>("Config", configSchema);
export default Config; 