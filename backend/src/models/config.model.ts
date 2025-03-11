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
        "syllabuses"
      ],
      unique: true
    },
    values: [{ type: String }],
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