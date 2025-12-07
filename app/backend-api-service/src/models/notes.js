import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        imageUrl: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            default: [],
        },
        title: {
            type: String,
            default: "",
        },
        summary: {
            type: String,
            default: "",
        },
        metadata: {
            type: Object,
            default: {},
        },
        interpretationCompleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("Note", NoteSchema);
