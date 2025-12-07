import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export const noteService = {
    uploadImageToS3: async (base64Image) => {
        if (!base64Image) {
            throw new Error("No image provided");
        }

        try {
            const blob = await fetch(base64Image).then((res) => res.blob());
            const presignRes = await axios.put(
                `${API_URL}/api/presigned-url`,
                {
                    fileType: blob.type || "image/jpeg"
                }
            );

            const { uploadUrl, fileUrl } = presignRes.data;

            await axios.put(uploadUrl, blob, {
                headers: {
                    "Content-Type": blob.type
                }
            });


            return {
                success: true,
                fileUrl
            };
        } catch (error) {
            console.error("Upload Error:", error);
            throw new Error("Image upload failed");
        }
    },
    createNote: async (data) => {
        try {
            const res = await axios.post(`${API_URL}/api/notes`, data);
            return res.data;
        } catch (error) {
            console.error("Create Note Error:", error);
            throw new Error("Failed to create note");
        }
    },
    getNotesByUser: async (userId) => {
        try {
            const res = await axios.get(`${API_URL}/api/notes/user/${userId}`);
            return res.data;
        } catch (error) {
            console.error("Get Notes Error:", error);
            throw new Error("Failed to fetch notes");
        }
    },
    getNoteById: async (noteId) => {
        try {
            const res = await axios.get(`${API_URL}/api/notes/${noteId}`);
            return res.data;
        } catch (error) {
            console.error("Get Note Error:", error);
            throw new Error("Failed to fetch note");
        }
    },
    updateNote: async (noteId, updateData) => {
        try {
            const res = await axios.put(
                `${API_URL}/api/notes/${noteId}`,
                updateData
            );
            return res.data;
        } catch (error) {
            console.error("Update Note Error:", error);
            throw new Error("Failed to update note");
        }
    },
    markInterpretationCompleted: async (noteId) => {
        try {
            const res = await axios.patch(
                `${API_URL}/api/notes/${noteId}/complete`
            );
            return res.data;
        } catch (error) {
            console.error("Interpretation Update Error:", error);
            throw new Error("Failed to update interpretation status");
        }
    },
    deleteNote: async (noteId) => {
        try {
            const res = await axios.delete(`${API_URL}/api/notes/${noteId}`);
            return res.data;
        } catch (error) {
            console.error("Delete Note Error:", error);
            throw new Error("Failed to delete note");
        }
    }
};
