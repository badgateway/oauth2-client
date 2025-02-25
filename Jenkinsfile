pipeline {
    agent { label 'docker-ci-stage' }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        AWS_CREDENTIALS_ID = 'AWSCodeArtifactCredentials'
        AWS_REGION         = 'eu-north-1'
        CODEARTIFACT_DOMAIN      = 'gtec-481745976483.d.codeartifact.eu-north-1.amazonaws.com'
        CODEARTIFACT_DOMAIN_OWNER= '481745976483'
        CODEARTIFACT_REPO        = 'npm/npm-aws'
    }

    stages {

        stage('Install AWS CLI') {
            steps {
                script {
                    sh '''
                        mkdir -p awscli-dist
                        cd awscli-dist

                        echo "Скачиваем AWS CLI..."
                        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

                        unzip awscliv2.zip 
                        ./aws/install --bin-dir $PWD/bin --install-dir $PWD/aws-cli --update
                        export PATH=$PWD/bin:$PATH
                        cd ..
                        aws --version
                    '''
                }
            }
        }

        stage('Checkout') {
            steps {
                script {
                    checkout scm
                    def branchParts = env.GIT_BRANCH?.tokenize('/')
                    if (branchParts?.size() >= 3 && branchParts[1] == 'tags') {
                        env.GIT_TAG = branchParts[2]
                    } else {
                        env.GIT_TAG = 'no-tag-found'
                    }
                    echo "Checked from GitHub: ${env.GIT_TAG}"
                }
            }
        }

        stage('AWS Auth') {
            steps {
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS_ID}"]]) {
                        sh """
                            export PATH=\$(pwd)/awscli-dist/bin:\$PATH
                            aws configure set aws_access_key_id \$AWS_ACCESS_KEY_ID
                            aws configure set aws_secret_access_key \$AWS_SECRET_ACCESS_KEY
                            aws configure set default.region ${AWS_REGION}
                        """
                    }
                }
            }
        }

        stage('CodeArtifact Login') {
            steps {
                script {
                    sh """
                       export PATH=\$(pwd)/awscli-dist/bin:\$PATH
                       export CODEARTIFACT_AUTH_TOKEN=\$(aws codeartifact get-authorization-token --domain gtec --domain-owner 481745976483 --region eu-north-1 --query authorizationToken --output text)
                       npm login --registry https://${CODEARTIFACT_DOMAIN}/${CODEARTIFACT_REPO}/ --auth-token=\"\$CODEARTIFACT_AUTH_TOKEN\" --auth-type=legacy
                    """
                }
            }
        }

        stage('Install NodeJS Dependencies') {
            steps {
                script {
                    sh "npm install"
                }
            }
        }

        stage('Prepublish') {
            steps {
                script {
                    sh "npm run prepublishOnly -- --tag=${env.GIT_TAG}"
                }
            }
        }

        stage('Publish to CodeArtifact') {
            steps {
                script {
                    sh "npm publish"
                }
            }
        }

        stage('Cleanup Workspace') {
            steps {
                script {
                    cleanWs()
                }
            }
        }
    }
}

