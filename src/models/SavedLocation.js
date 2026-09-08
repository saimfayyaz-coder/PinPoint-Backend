import mongoose from "mongoose";

const savedLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    category: {
      type: String,
      enum: ["home", "work", "favorite", "other"],
      default: "other",
    },
    placeId: {
      type: String,
      default: null,
    },
    isPoi: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

savedLocationSchema.index({ userId: 1 });

const SavedLocation = mongoose.model("SavedLocation", savedLocationSchema);

export default SavedLocation;
