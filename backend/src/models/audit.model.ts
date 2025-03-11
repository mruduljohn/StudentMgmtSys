import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "UPLOAD", "LOGIN", "LOGOUT", "CONFIG_CHANGE"]
    },
    entityType: {
      type: String,
      required: true,
      enum: ["STUDENT", "USER", "CONFIG", "SYSTEM"]
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function(this: any) {
        return this.entityType !== "SYSTEM";
      }
    },
    details: {
      type: Object
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Audit", auditSchema); 