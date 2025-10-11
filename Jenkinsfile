pipeline {
    agent any

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
                trivy fs . \
                  --format json -o trivy-fs-report.json \
                  --severity HIGH,CRITICAL --exit-code 0

                trivy config . \
                  --format json -o trivy-config-report.json \
                  --severity HIGH,CRITICAL --exit-code 0
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-*-report.json', fingerprint: true
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
     
    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed! Check logs for errors."
        }
    }
}
