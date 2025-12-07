import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export const noteService = {
    uploadImageToS3: async (base64Image) => {
        if (!base64Image) {
            throw new Error("No image provided");
        }

        try {
            // 1️ Convert base64 → Blob
            const blob = await fetch(base64Image).then((res) => res.blob());
            console.log(blob.type);
            // 2️ Get presigned URL from backend
            const presignRes = await axios.put(
                `${API_URL}/api/presigned-url`, // backend endpoint
                {
                    fileType: blob.type || "image/jpeg"
                }
            );

            const { uploadUrl, fileUrl } = presignRes.data;

            // 3️ Upload directly to S3
            // await axios.put(uploadUrl, blob, {
            //     headers: {
            //         "Content-Type": blob.type
            //     }
            // });

            await fetch(uploadUrl, { method: "PUT", body: blob })

            return {
                success: true,
                fileUrl
            };
        } catch (error) {
            console.error("Upload Error:", error);
            throw new Error("Image upload failed");
        }
    }
};
