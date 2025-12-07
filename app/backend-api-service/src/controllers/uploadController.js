import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { S3Client } from "@aws-sdk/client-s3";

export const imageUpload = async (req, res) => {
  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
    });

    const { fileType } = req.body;
    if (!fileType) {
      return res.status(400).json({ error: "fileType required" });
    }

    const fileKey = `uploads/${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.json({
      uploadUrl,
      fileUrl,
      key: fileKey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
};
