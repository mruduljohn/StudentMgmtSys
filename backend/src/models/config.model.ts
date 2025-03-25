import mongoose from "mongoose";

const configSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "batches",
        "classTeachers",
        "hostels",
        "streams",
        "programs",
        "studyMaterials",
        "uniforms",
        "idCards",
        "tabs",
        "joinedStatuses",
        "syllabuses",
        "subjectChapters",
        "backupSchedule"
      ],
      unique: true,
      index: true
    },
    values: {
      type: [String],
      required: true
    },
    // For subject chapters, we need a more structured approach
    // This will be used only for 'subjectChapters' category
    subjectChapters: {
      type: Map,
      of: [String],
      default: new Map()
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Config", configSchema); 