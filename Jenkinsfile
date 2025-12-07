pipeline {
  agent any

  environment {
    ARTIFACT_DIR = "${WORKSPACE}/artifacts"

    AWS_REGION     = "us-east-1"
    AWS_ACCOUNT_ID = "831347845050"

    ECS_CLUSTER = "notepad-us-east-1"
    IMAGE_TAG   = "latest"
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

    stage('Build, Push & Deploy Services') {
      steps {
        script {
          def services = [
            [
              name: "auth-service",
              path: "app/auth-service",
              ecr:  "auth-service"
            ],
            [
              name: "frontend-service",
              path: "app/frontend-service",
              ecr:  "frontend-service"
            ]
          ]

          services.each { svc ->

            def ecrRepo = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${svc.ecr}"

            echo "🚀 Deploying ${svc.name}"

            dir(svc.path) {
              sh """
                docker build -t ${svc.name}:${IMAGE_TAG} .
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
  }

  post {
    success {
      echo "All services built and deployed successfully!"
    }
    failure {
      echo "Deployment failed. Check logs."
    }
    always {
      sh "ls -lh ${ARTIFACT_DIR} || true"
    }
  }
}
