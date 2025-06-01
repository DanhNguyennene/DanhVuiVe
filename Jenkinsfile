pipeline {
    agent {
        docker {
            image 'google/cloud-sdk:latest'
        }
    }

    environment {
        // Define environment variables
        DOCKER_IMAGE_BACKEND = "danhvm12345/chatbot-backend"
        DOCKER_IMAGE_FRONTEND = "danhvm12345/chatbot-frontend"
        DOCKER_TAG_BACKEND = "latest"
        DOCKER_TAG_FRONTEND = "latest"
        // DOCKER_TOKEN = credentials('docker')
        BACKEND_SHA = ""
        FRONTEND_SHA = ""
        KUBE_NAMESPACE = "model-serving" // Target Kubernetes namespace
        HELM_RELEASE_NAME = "chatbot" // Helm release name
        HELM_CHART_PATH = "chatbot-app/deployments/chatbot" // Path to Helm chart directory
        GKE_KEY_FILE = credentials('gke')
        GKE_CLUSTER = "danhvuive"
        GKE_ZONE = "us-central1-c"
        GKE_PROJECT = "testing-api-1712477161338"
    }

    stages {

        stage('Installing GCLOUD SDK') {

            steps {
                script {
                    sh '''
                    # Authenticate gcloud with the service account key
                    gcloud auth activate-service-account --key-file ${GKE_KEY_FILE}

                    apt-get install kubectl

                    # Verify gcloud installation
                    gcloud version
                    '''
                }
            }
        }

        stage('Authenticate with GKE') {
            steps {
                script {
                    sh """
                    gcloud auth activate-service-account --key-file ${GKE_KEY_FILE}
                    gcloud container clusters get-credentials ${GKE_CLUSTER} --zone ${GKE_ZONE} --project ${GKE_PROJECT}
                    """
                }
            }
        }

        stage('Fetch OpenAI API Key') {
            steps {
                script {
                    OPENAI_API_KEY = sh(script: '''
                        kubectl get secret openai-api-key -n ${KUBE_NAMESPACE} \
                        -o jsonpath="{.data.OPENAI_API_KEY}" | base64 --decode
                    ''', returnStdout: true).trim()
                    echo "Fetched OPENAI_API_KEY: ****"
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('chatbot-app/backend') {
                            script {
                                dockerImageBackend = docker.build("${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG_BACKEND}")
                            }
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('chatbot-app/frontend') {
                            script {
                                dockerImageFrontend = docker.build("${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG_FRONTEND}")
                            }
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push Backend Image') {
                    steps {
                        script {
                            docker.withRegistry('https://registry.hub.docker.com',  'dockerhub') {
                                dockerImageBackend.push()
                            }
                        }
                    }
                }
                stage('Push Frontend Image') {
                    steps {
                        script {
                            docker.withRegistry('https://registry.hub.docker.com',  'dockerhub') {
                                dockerImageFrontend.push()
                            }
                        }
                    }
                }
            }
        }

        stage('Fetch Latest SHA') {
            steps {
                script {
                    sh 'apt update -qq && apt install -y jq >/dev/null 2>&1'

                    BACKEND_SHA = sh(script: """
                        curl -s "https://registry.hub.docker.com/v2/repositories/${DOCKER_IMAGE_BACKEND}/tags/latest"  | jq -r '.images[0].digest'
                    """, returnStdout: true).trim()

                    FRONTEND_SHA = sh(script: """
                        curl -s "https://registry.hub.docker.com/v2/repositories/${DOCKER_IMAGE_FRONTEND}/tags/latest"  | jq -r '.images[0].digest'
                    """, returnStdout: true).trim()

                    echo "Backend Image SHA: ${BACKEND_SHA}"
                    echo "Frontend Image SHA: ${FRONTEND_SHA}"
                }
            }
        }

            stage('Deploy to Kubernetes with Helm') {
                steps {
                    script {
                    sh 'curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash'
                    echo "BACKEND_SHA: ${BACKEND_SHA}"
                    echo "FRONTEND_SHA: ${FRONTEND_SHA}"
                    echo "HELM_RELEASE_NAME: ${HELM_RELEASE_NAME}"
                    echo "HELM_CHART_PATH: ${HELM_CHART_PATH}"
                    echo "KUBE_NAMESPACE: ${KUBE_NAMESPACE}"
                    // Then run the Helm upgrade command separately
                    sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ${HELM_CHART_PATH} \\
                            --namespace ${KUBE_NAMESPACE} \\
                            --set backend.image.repository=${DOCKER_IMAGE_BACKEND} \\
                            --set backend.image.tag=${BACKEND_SHA} \\
                            --set frontend.image.repository=${DOCKER_IMAGE_FRONTEND} \\
                            --set frontend.image.tag=${FRONTEND_SHA} \\
                            --set ingress.host=chatbot.danhvuive.34.121.113.166.nip.io
                    """
                    }
                }
            }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed."
            mail to: 'danhvm12345@gmail.com',
                 subject: "Jenkins Pipeline Failed: ${currentBuild.fullDisplayName}",
                 body: "The pipeline failed at stage: ${currentBuild.currentResult}"
        }
    }
}