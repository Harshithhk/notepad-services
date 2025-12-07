import AWS from "aws-sdk";

const sqs = new AWS.SQS({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

export const publishToSQS = async (note) => {
    const params = {
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/831347845050/image-upload-events-queue',
        MessageBody: JSON.stringify(note)
    };

    return sqs.sendMessage(params).promise();
};
