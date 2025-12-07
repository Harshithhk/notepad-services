pipeline {
  agent any

  environment {
    ARTIFACT_DIR = "${WORKSPACE}/artifacts"

    AWS_REGION     = "us-east-1"
    AWS_ACCOUNT_ID = "831347845050"

    ECS_CLUSTER = "notepad-us-east-1"
    IMAGE_TAG   = "latest"

    IMAGE_PROCESSING_ECR = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/image-processing"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Security Scan (Trivy)') {
      steps {
        sh '''
          mkdir -p ${ARTIFACT_DIR}

          trivy fs . \
            --format json \
            --severity HIGH,CRITICAL \
            --exit-code 0 \
            -o ${ARTIFACT_DIR}/trivy-fs.json

          trivy config . \
            --format json \
            --severity HIGH,CRITICAL \
            --exit-code 0 \
            -o ${ARTIFACT_DIR}/trivy-iac.json
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'artifacts/*.json', fingerprint: true
        }
      }
    }

    stage('Login to ECR') {
      steps {
        sh '''
          aws ecr get-login-password --region ${AWS_REGION} \
          | docker login --username AWS --password-stdin \
            ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
        '''
      }
    }

    stage('Build, Push & Deploy ECS Services') {
      steps {
        script {

          def services = [
            [
              name: "auth-service",
              path: "app/auth-service",
              ecr:  "auth-service"
            ],
            [
              name: "backend-api",
              path: "app/backend-api-service",
              ecr:  "backend-api"
            ],
            [
              name: "frontend-service",
              path: "app/frontend-service",
              ecr:  "frontend-service",
              buildArgs: """
                --build-arg VITE_AUTH_API_URL=https://auth.notepad-minus-minus.harshithkelkar.com \
                --build-arg VITE_BACKEND_API_URL=https://api.notepad-minus-minus.harshithkelkar.com
              """.trim()
            ]
          ]

          services.each { svc ->

            def ecrRepo = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${svc.ecr}"

            dir(svc.path) {
              sh """
                docker build ${svc.buildArgs ?: ""} -t ${svc.name}:${IMAGE_TAG} .
                docker tag ${svc.name}:${IMAGE_TAG} ${ecrRepo}:${IMAGE_TAG}
                docker push ${ecrRepo}:${IMAGE_TAG}
              """
            }

            sh """
              aws ecs update-service \
                --cluster ${ECS_CLUSTER} \
                --service ${svc.name} \
                --force-new-deployment \
                --region ${AWS_REGION}
            """
          }
        }
      }
    }

    stage('Build & Push Image-Processing Task') {
      steps {
        dir('app/image-processing-service') {
          sh '''
            echo "Building image-processing image..."
            docker build -t image-processing:${IMAGE_TAG} .

            echo "Tagging image..."
            docker tag image-processing:${IMAGE_TAG} ${IMAGE_PROCESSING_ECR}:${IMAGE_TAG}

            echo "Pushing image to ECR..."
            docker push ${IMAGE_PROCESSING_ECR}:${IMAGE_TAG}
          '''
        }
      }
    }
  }

  post {
    success {
      echo "✅ All services and tasks built successfully!"
    }
    failure {
      echo "❌ Deployment failed. Check logs."
    }
    always {
      sh "ls -lh ${ARTIFACT_DIR} || true"
    }
  }
}
