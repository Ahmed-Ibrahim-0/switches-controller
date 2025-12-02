import mongoose from "mongoose";
import Counter from "./counter.model.js";

const switchSchema = new mongoose.Schema(
  {
    uniqueKey: { type: Number, unique: true, require: true },
    provider: { type: String },
    serialNumber: { type: String },
    model: { type: String },
    oldSerialNumber: { type: String },
    oldModel: { type: String },
    newSerialNumber: { type: String },
    newModel: { type: String },
    dateSent: { type: Date },
    notes: { type: String },
    status: {
      type: String,
      enum: ["faulty_not_sent", "sent_for_fix", "fixed"],
      default: "faulty_not_sent",
    },
    deliveredStatus: {
      type: String,
      enum: ["delivered", "not_delivered"],
    },
  },
  { timestamps: true }
);

switchSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "switches" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.uniqueKey = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Switch = mongoose.model("Switch", switchSchema);
export default Switch;
