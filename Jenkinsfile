pipeline {
    agent any

    environment {
        ARTIFACT_DIR = "${WORKSPACE}/artifacts"
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

        stage('Prepare Scripts') {
            steps {
                echo "Ensuring deploy script is executable..."
                sh 'chmod +x ./scripts/deploy.sh'
            }
        }

        stage('Deploy Static Site') {
            steps {
                echo "Running deploy.sh to deploy infrastructure and static site..."
                sh './scripts/deploy.sh'
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                echo "Archiving build outputs..."
                sh '''
                mkdir -p ${ARTIFACT_DIR}

                # Example: copy any build outputs to artifacts directory
                if [ -d build ]; then
                    cp -r build/* ${ARTIFACT_DIR}/ || true
                fi

                if [ -d dist ]; then
                    cp -r dist/* ${ARTIFACT_DIR}/ || true
                fi

                if [ -f *.zip ] || [ -f *.tar.gz ]; then
                    cp -r *.zip *.tar.gz ${ARTIFACT_DIR}/ || true
                fi
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
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed! Check logs for errors."
        }
        always {
            echo "Cleaning up workspace..."
            sh 'ls -lh ${ARTIFACT_DIR} || true'
        }
    }
}
