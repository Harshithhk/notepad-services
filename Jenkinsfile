pipeline {
    agent any

    environment {
        ARTIFACT_DIR = "${WORKSPACE}/artifacts"

        AWS_REGION = "us-east-1"
        AWS_ACCOUNT_ID = "831347845050"

        // ECR repositories
        AUTH_ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/auth-service"
        FRONTEND_ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend-service"

        // ECS
        ECS_CLUSTER = "notepad-us-east-1"
        AUTH_SERVICE_NAME = "auth-service"
        FRONTEND_SERVICE_NAME = "frontend-service"

        IMAGE_TAG = "latest"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Checking out repository..."
                checkout scm
            }
        }

        stage('Dependency & IaC Scan (Trivy)') {
            steps {
                echo 'Running Trivy scan on filesystem and IaC...'
                sh '''
                mkdir -p ${ARTIFACT_DIR}

                trivy fs . \
                  --format json -o ${ARTIFACT_DIR}/trivy-fs-report.json \
                  --severity HIGH,CRITICAL --exit-code 0

                trivy config . \
                  --format json -o ${ARTIFACT_DIR}/trivy-config-report.json \
                  --severity HIGH,CRITICAL --exit-code 0
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'artifacts/trivy-*-report.json', fingerprint: true
                }
            }
        }

        stage('Login to ECR') {
            steps {
                echo "Logging into Amazon ECR..."
                sh '''
                aws ecr get-login-password --region ${AWS_REGION} \
                  | docker login \
                    --username AWS \
                    --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
            }
        }

        stage('Build & Push Auth Service Image') {
            steps {
                dir('auth-service') {
                    echo "Building auth-service Docker image..."
                    sh '''
                    docker build -t auth-service:${IMAGE_TAG} .
                    docker tag auth-service:${IMAGE_TAG} ${AUTH_ECR_REPO}:${IMAGE_TAG}
                    docker push ${AUTH_ECR_REPO}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Build & Push Frontend Service Image') {
            steps {
                dir('frontend-service') {
                    echo "Building frontend-service Docker image..."
                    sh '''
                    docker build -t frontend-service:${IMAGE_TAG} .
                    docker tag frontend-service:${IMAGE_TAG} ${FRONTEND_ECR_REPO}:${IMAGE_TAG}
                    docker push ${FRONTEND_ECR_REPO}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy Auth Service to ECS') {
            steps {
                echo "Triggering ECS redeploy for auth-service..."
                sh '''
                aws ecs update-service \
                  --cluster ${ECS_CLUSTER} \
                  --service ${AUTH_SERVICE_NAME} \
                  --force-new-deployment \
                  --region ${AWS_REGION}
                '''
            }
        }

        stage('Deploy Frontend Service to ECS') {
            steps {
                echo "Triggering ECS redeploy for frontend-service..."
                sh '''
                aws ecs update-service \
                  --cluster ${ECS_CLUSTER} \
                  --service ${FRONTEND_SERVICE_NAME} \
                  --force-new-deployment \
                  --region ${AWS_REGION}
                '''
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                echo "Archiving build artifacts..."
                sh '''
                mkdir -p ${ARTIFACT_DIR}
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'artifacts/**/*', fingerprint: true
                }
            }
        }
    }

    post {
        success {
            echo "✅ Docker build & ECS deployment completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
        always {
            echo "Artifacts summary:"
            sh 'ls -lh ${ARTIFACT_DIR} || true'
        }
    }
}