import AWS from "aws-sdk";

const sqs = new AWS.SQS({ region: "us-east-1" });
// const QUEUE_URL = process.env.SQS_QUEUE_URL;
// TODO replace with env
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/831347845050/image-processing-queue";

export const publishToSQS = async (note) => {
  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(note),
  };

  return sqs.sendMessage(params).promise();
};
