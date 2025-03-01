def CURRENT_DATE = new Date().format('yyyyMMdd')
def COMMIT_AUTHOR_NAME = ''
def BUILD_TRIGGERED_BY = ''

def OAUTH2_VERSION = ''
def SLACK_MESSAGE = ''

pipeline {
    agent {
        label 'docker-ci-stage'
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '3'))
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        REGION = 'eu-north-1'
        REGISTRY_URL = 'https://gtec-481745976483.d.codeartifact.eu-north-1.amazonaws.com/npm/npm-aws/'
        REGISTRY_ENDPOINT = 'https://gtec-481745976483.d.codeartifact.eu-north-1.amazonaws.com/npm/npm-aws/'
        DOMAIN_OWNER = '481745976483'
        OAUTH2_VERSION = ''
        REPOSITORY_NAME = 'npm-aws'
        SLACK_WEBHOOK = credentials('SLACK_WEBHOOK')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare parameters') {
            steps {
                script {
                    OAUTH2_VERSION = sh(script: "git describe --exact-match --tags \$(git rev-parse HEAD) || echo ''", returnStdout: true).trim()
                    
                    if (OAUTH2_VERSION == '') {
                        echo 'No tag found. Skipping build.'
                        return
                    } else {
                        OAUTH2_VERSION = OAUTH2_VERSION.replaceAll(/^v\.?/, '')
                        echo "Processed Tag: ${OAUTH2_VERSION}"
                    }
                    
                    COMMIT_AUTHOR_NAME = sh(script: "git log -n 1 ${env.GIT_COMMIT} --format=%aN", returnStdout: true).trim()
                    BUILD_TRIGGERED_BY = currentBuild.getBuildCauses()[0].shortDescription
                    SLACK_MESSAGE =
                        "Build triggered by: ${BUILD_TRIGGERED_BY}\n" +
                        "Branch: ${env.BRANCH_NAME}, Version: ${OAUTH2_VERSION}, Commit: ${env.GIT_COMMIT[0..6]}, Author: ${COMMIT_AUTHOR_NAME}\n" +
                        "Docker Image: ${REGISTRY_URL}/${REPOSITORY_NAME}:${OAUTH2_VERSION}\n" +
                        "${env.BUILD_URL}"
                }
            }
        }

        stage('Build Docker Image') {
            when {
                expression { OAUTH2_VERSION != '' }
            }
            steps {
                withAWS(credentials: 'aws-credentials') {
                    script {
                        sh '''
                        docker build --build-arg AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                                     --build-arg AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                                     --build-arg REGION=${REGION} \
                                     --build-arg REGISTRY_URL=${REGISTRY_URL} \
                                     --build-arg REGISTRY_ENDPOINT=${REGISTRY_ENDPOINT} \
                                     --build-arg DOMAIN_OWNER=${DOMAIN_OWNER} \
                                     --build-arg OAUTH2_VERSION=${OAUTH2_VERSION} \
                                     --build-arg REPOSITORY_NAME=${REPOSITORY_NAME} \
                                     -t ${REGISTRY_URL}/${REPOSITORY_NAME}:${OAUTH2_VERSION} .
                        '''
                    }
                }
            }
        }

        stage('Cleanup') {
            when {
                expression { OAUTH2_VERSION != '' }
            }
            steps {
                sh '''
                    docker ps -q --filter ancestor=${REGISTRY_URL}/${REPOSITORY_NAME}:${OAUTH2_VERSION} | xargs -r docker stop
                    docker rmi ${REGISTRY_URL}/${REPOSITORY_NAME}:${OAUTH2_VERSION} || true
                    '''
            }
        }
    }

    post {
        success {
            node {
                sh '''
                curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"BUILD SUCCESS: ${SLACK_MESSAGE}"}' \
                    ${SLACK_WEBHOOK}
                '''
            }
        }
        failure {
            node {
                sh '''
                curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"BUILD FAILURE: ${SLACK_MESSAGE}"}' \
                    ${SLACK_WEBHOOK}
                '''
            }
        }
        unsuccessful {
            node {
                sh '''
                curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"BUILD UNSUCCESSFUL: ${SLACK_MESSAGE}"}' \
                    ${SLACK_WEBHOOK}
                '''
            }
        }
        cleanup {
            node {
                cleanWs()
            }
        }
    }
}
