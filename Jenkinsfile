def CURRENT_DATE = new Date().format('yyyyMMdd')
def COMMIT_AUTHOR_NAME = ''
def BUILD_TRIGGERED_BY = ''

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
        REPOSITORY_NAME = 'npm-aws'
    }

    stages {
stage('Checkout') {
    steps {
        script {
            checkout([
                $class: 'GitSCM',
                branches: scm.branches,
                doGenerateSubmoduleConfigurations: false,
                extensions: [
                    [$class: 'PruneStaleBranch'],
                    [$class: 'CleanBeforeCheckout'],
                    [$class: 'CloneOption', depth: 1, noTags: false, shallow: true],
                    [$class: 'CheckoutOption', timeout: 20]
                ],
                submoduleCfg: [],
                userRemoteConfigs: [
                    [
                        url: scm.userRemoteConfigs[0].url,
                        refspec: "+refs/heads/*:refs/remotes/origin/* +refs/tags/*:refs/tags/*"
                    ]
                ]
            ])
        }
    }
}




         stage('Handle OAUTH2 Version') {
            steps {
                script {
                    env.OAUTH2_VERSION = sh(script: "git tag | tail -n1 | cut -c2- ", returnStdout: true).trim()
                    if (env.OAUTH2_VERSION == '') {
                        echo 'Pipe message: No tag found. Skipping build.'
                        return
                    } else {
                        //OAUTH2_VERSION_TMP = OAUTH2_VERSION.replace(/^v\.?/, '')
                        //env.OAUTH2_VERSION = OAUTH2_VERSION_TMP
                        echo "Pipe message: Processed Tag: ${OAUTH2_VERSION}"
                   }
                }
            }
         }  
        stage('Preparing archive') {
            steps {
                script {
                    sh 'tar -cf oauth2-client.tar --exclude oauth2-client.tar --exclude .git* .'
                }
            }
        }

        stage('Build Docker Image') {
            when {
                expression { env.OAUTH2_VERSION != '' }
            }
            steps {
                withAWS(credentials: 'AWSCodeArtifactCredentials') {
                    script {
                        sh '''
                        echo 'Env var: ${OAUTH2_VERSION}'
                        docker build --build-arg AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                                     --build-arg AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                                     --build-arg REGION=${REGION} \
                                     --build-arg REGISTRY_URL=${REGISTRY_URL} \
                                     --build-arg REGISTRY_ENDPOINT=${REGISTRY_ENDPOINT} \
                                     --build-arg DOMAIN_OWNER=${DOMAIN_OWNER} \
                                     --build-arg OAUTH2_VERSION=${OAUTH2_VERSION} \
                                     --build-arg REPOSITORY_NAME=${REPOSITORY_NAME} \
                                     -t oauth2-client:momentary .
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
                    set -e
                    docker ps -q --filter ancestor=oauth2-client:momentary | xargs -r docker stop
                    docker rmi oauth2-client:momentary || true
                '''
            }
        }
    }

    post {
        always {
            node('docker-ci-stage') {
                cleanWs()
            }
        }
    }
}
