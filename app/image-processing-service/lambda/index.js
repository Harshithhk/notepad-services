import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
    console.log("Received SQS event:", JSON.stringify(event));

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        const { noteId, imageUrl } = messageBody;

        const params = {
            cluster: process.env.ECS_CLUSTER_NAME,
            taskDefinition: process.env.ECS_TASK_DEFINITION,
            launchType: "FARGATE",
            networkConfiguration: {
                awsvpcConfiguration: {
                    subnets: process.env.ECS_SUBNETS.split(","),
                    securityGroups: process.env.ECS_SECURITY_GROUPS.split(","),
                    assignPublicIp: "ENABLED",
                },
            },
            overrides: {
                containerOverrides: [
                    {
                        name: process.env.ECS_CONTAINER_NAME,
                        environment: [
                            { name: "NOTE_ID", value: noteId },
                            { name: "IMAGE_URL", value: imageUrl },
                        ],
                    },
                ],
            },
        };

        try {
            const data = await ecsClient.send(new RunTaskCommand(params));
            console.log("Started ECS task:", data.tasks[0].taskArn);
        } catch (err) {
            console.error("Failed to start ECS task:", err);
            throw err;
        }
    }

    return { statusCode: 200 };
};
