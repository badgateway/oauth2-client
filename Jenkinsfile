def CURRENT_DATE = new Date().format('yyyyMMdd')
def COMMIT_AUTHOR_NAME = ''
def BUILD_TRIGGERED_BY = ''
def OAUTH2_VERSION = ''

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
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    checkout([
                        $class: 'GitSCM',
                        branches: scm.branches,
                        extensions: scm.extensions + [
                            [$class: 'CloneOption', noTags: false, depth: 1, shallow: true],
                            [$class: 'PruneStaleBranch'],
                            [$class: 'CleanBeforeCheckout'],
                            [$class: 'CloneOption', fetchTags: true]
                        ],
                        userRemoteConfigs: scm.userRemoteConfigs
                    ])
                }
            }
        }

        stage('Prepare parameters') {
            steps {
                script {
                    // Отладочная информация: какие теги вообще видит Jenkins?
                    sh "git fetch --tags"
                    sh "git tag"

                    // Получаем тег коммита
                    OAUTH2_VERSION = sh(script: "git tag --points-at HEAD | tail -n 1 || echo ''", returnStdout: true).trim()

                    if (OAUTH2_VERSION == '') {
                        echo 'No tag found. Skipping build.'
                        return
                    } else {
                        OAUTH2_VERSION = OAUTH2_VERSION.replaceAll(/^v\.?/, '')
                        echo "Processed Tag: ${OAUTH2_VERSION}"
                    }

                    COMMIT_AUTHOR_NAME = sh(script: "git log -n 1 ${env.GIT_COMMIT} --format=%aN", returnStdout: true).trim()
                    BUILD_TRIGGERED_BY = currentBuild.getBuildCauses()[0].shortDescription
                }
            }
        }

        stage('Build Docker Image') {
            when {
                expression { OAUTH2_VERSION != '' }
            }
            steps {
                withAWS(credentials: 'AWSCodeArtifactCredentials') {
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
        cleanup {
            node('docker-ci-stage') {
                cleanWs()
            }
        }
    }
}
