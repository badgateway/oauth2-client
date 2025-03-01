def AWS_ACCESS_KEY_ID = ''
def AWS_SECRET_ACCESS_KEY = ''
def REGION = ''
def REGISTRY_URL = ''
def REGISTRY_ENDPOINT = ''
def DOMAIN_OWNER = ''
def OAUTH2_VERSION = ''
def REPOSITORY_NAME = ''


pipeline {
    agent {
        label 'docker-ci-stage'
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(
            logRotator(
                numToKeepStr: '30'
            )
        )
    }

    triggers {
        pollSCM 'H/5 * * * *'
    }

    parameters{
        REGISTRY_URL=""
    }
    environment {

    }

    stages {
        stage('Prepare parameters') {
            when {
                anyOf {
                    branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    expression {params.FORCE_BUILD}
                    expression {params.ANALYSIS}
// Should be enabled when unit-tests will created in repo
                    // expression {params.UNIT_TESTS}
                }
            }
            steps {
                script {
                    def POM = readMavenPom file: INITIAL_POM
                    APPLICATION_VERSION = POM.version
                    TAG = env.BRANCH_NAME.replaceAll("[^a-zA-Z0-9.-]+","_")
                    TAG_UNIQUE = "${TAG}-${CURRENT_DATE}-${env.GIT_COMMIT[0..6]}"

                    COMMIT_AUTHOR_NAME = sh(script: "git log -n 1 ${env.GIT_COMMIT} --format=%aN", returnStdout: true).trim()
                    BUILD_TRIGGERED_BY = currentBuild.getBuildCauses()[0].shortDescription
                    SLACK_MESSAGE =
                        "//auth// service, ${BUILD_TRIGGERED_BY}\n" +
                        "branch: //${env.BRANCH_NAME}//, version: //${APPLICATION_VERSION}//, commit: //${env.GIT_COMMIT[0..6]}//, commit author: //${COMMIT_AUTHOR_NAME}//\n" +
                        "Docker image tag: //${TAG_UNIQUE}//\n" +
                        "${env.BUILD_URL}"

                    switch (env.BRANCH_NAME) {
                        case 'master':
                            MAVEN_PROFILE = "release"
                            ARTIFACTORY_REPO = 'core-release-local'
                            TAG_DEPLOY = TAG_UNIQUE
                            break;
                        case ~/\d+\.\d+\.\d+/:
                            MAVEN_PROFILE = "release"
                            ARTIFACTORY_REPO = 'core-release-local'
                            TAG_DEPLOY = TAG
                            break;
                        default:
                            MAVEN_PROFILE = "dev"
                            ARTIFACTORY_REPO = 'core-dev-local'
                            TAG_DEPLOY = TAG_UNIQUE
                            break;
                    }

                    currentBuild.description = TAG_DEPLOY
                }
            }
        }

        stage('Analysis') {
            when {
                anyOf {
                    branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    expression {params.ANALYSIS}
                }
            }
            steps {
                script {
                    echo "Temporary disabled - https://gmntc.atlassian.net/browse/GC-7006"
//                     withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'artifactory-jenkins', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
//                         IMAGE_ANALYSIS = docker.build(
//                             "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}:${TAG}-analysis",
//                             "--build-arg MAVEN_TAG=${params.MAVEN_TAG} " +
//                             "--build-arg MAVEN_GOALS='clean checkstyle:checkstyle-aggregate pmd:aggregate-pmd compile' " +
//                             "--build-arg MAVEN_PROFILE=${MAVEN_PROFILE} " +
//                             "--build-arg MAVEN_ARTIFACTORY_REPO=${ARTIFACTORY_REPO} " +
//                             "--build-arg MAVEN_REPO_USERNAME=${USERNAME} " +
//                             "--build-arg MAVEN_REPO_PASSWORD=${PASSWORD} " +
//                             "--build-arg OPENJDK_TAG=${params.OPENJDK_TAG} " +
//                             "--build-arg PROMETHEUS_JAVAAGENT_VERSION=${params.PROMETHEUS_JAVAAGENT_VERSION} " +
//                             "--build-arg ELASTIC_APM_AGENT_VERSION=${params.ELASTIC_APM_AGENT_VERSION} " +
//                             "--build-arg PROTOBUF_VERSION=${params.PROTOBUF_VERSION} " +
//                             "--target build " +
//                             "--progress plain " +
//                             "."
//                         )
//                     }
                }
            }
//             post {
//                 always {
//                     script {
//                         IMAGE_ANALYSIS.withRun("--name extract-from-${TAG_UNIQUE}") {c ->
//                             sh "docker cp extract-from-${TAG_UNIQUE}:/app/target/checkstyle-result.xml ."
//                             sh "docker cp extract-from-${TAG_UNIQUE}:/app/target/pmd.xml ."
//                         }
//
//                         recordIssues(
//                             tools: [
//                                 checkStyle(),
//                                 pmdParser()
//                             ],
// //                            failOnError: true,  // fail build if violations found in analysis
//                             enabledForFailure: true,
//                             ignoreFailedBuilds: false
//                         )
//
//                         sh "docker rmi --force ${IMAGE_ANALYSIS.id}"
//                     }
//                 }
//                 unsuccessful {
//                     script {
//                         currentBuild.result = 'FAILURE'
//                         error("Errors found in analysis")
//                     }
//                     slackSend(
//                         color: 'danger',
//                         message: "BUILD ANALYSIS ${currentBuild.currentResult}: " + SLACK_MESSAGE
//                     )
//                 }
//             }
        }

// Should be enabled when unit-tests will created in repo
        // stage('Unit tests') {
        //     when {
        //         anyOf {
        //             branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
        //             expression {params.UNIT_TESTS}
        //         }
        //     }
        //     steps {
        //         script {
        //             USER_UID = sh(script: "id -u", returnStdout: true).trim()
        //             DOCKER_SOCKET_GID = sh(script: "stat -c %g /var/run/docker.sock", returnStdout: true).trim()
        //             withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'artifactory-jenkins', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
        //                 docker.image("maven:${params.MAVEN_TAG}").inside("-u $USER_UID:$DOCKER_SOCKET_GID -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:$PWD -e MAVEN_USERNAME=${USERNAME} -e MAVEN_PASSWORD=${PASSWORD}") {
        //                     sh "mvn -f pom.xml --settings settings.xml --activate-profiles ${MAVEN_PROFILE} --quiet clean test"
        //                 }
        //             }
        //         }
        //     }
        //     post {
        //         unsuccessful {
        //             slackSend(
        //                 color: 'danger',
        //                 message: "BUILD UNIT TESTS ${currentBuild.currentResult}: " + SLACK_MESSAGE
        //             )
        //         }
        //     }
        // }

        stage('Docker build') {
            when {
                anyOf {
                    branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    expression {
                        params.FORCE_BUILD
                    }
                }
            }
            steps {
                script {
                    withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'artifactory-jenkins', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
                        IMAGE = docker.build(
                            "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}:${TAG}",
                            "--build-arg MAVEN_TAG=${params.MAVEN_TAG} " +
                            "--build-arg MAVEN_GOALS='clean install deploy' " +
                            "--build-arg MAVEN_PROFILE=${MAVEN_PROFILE} " +
                            "--build-arg MAVEN_ARTIFACTORY_REPO=${ARTIFACTORY_REPO} " +
                            "--build-arg MAVEN_REPO_USERNAME=${USERNAME} " +
                            "--build-arg MAVEN_REPO_PASSWORD=${PASSWORD} " +
                            "--build-arg OPENJDK_TAG=${params.OPENJDK_TAG} " +
                            "--build-arg PROMETHEUS_JAVAAGENT_VERSION=${params.PROMETHEUS_JAVAAGENT_VERSION} " +
                            "--build-arg ELASTIC_APM_AGENT_VERSION=${params.ELASTIC_APM_AGENT_VERSION} " +
                            "--progress plain " +
                            "."
                        )
                    }
                }
            }
            post {
                unsuccessful {
                    slackSend(
                        color: 'danger',
                        message: "BUILD ${currentBuild.currentResult}: " + SLACK_MESSAGE
                    )
                }
            }
        }

        stage('Docker push') {
            when {
                anyOf {
                    branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    expression {
                        params.FORCE_BUILD
                    }
                }
            }
            steps {
                script {
                    docker.withRegistry('', env.DOCKER_HUB_CREDENTIALS) {
                        IMAGE.push()
                        if (!(env.BRANCH_NAME ==~ '\\d+\\.\\d+\\.\\d+')) {
                            IMAGE.push(TAG_UNIQUE)
                        }
                        if (env.BRANCH_NAME == 'master') {
                            IMAGE.push('latest')
                        }
                    }

                    // cleanup
                    sh "docker rmi ${IMAGE.id}"
                }
            }
            post {
                unsuccessful {
                    slackSend(
                        color: 'danger',
                        message: "BUILD ${currentBuild.currentResult}: " + SLACK_MESSAGE
                    )
                }
            }
        }

        stage('Send notifications') {
            when {
                anyOf {
                    branch pattern: 'dev|master|\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    expression {
                        params.FORCE_BUILD
                    }
                }
            }
            steps {
                slackSend(
                    color: 'good',
                    message: "BUILD SUCCESS: " + SLACK_MESSAGE
                )
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    // branch pattern: 'dev', comparator: 'REGEXP'
                    expression {
                        params.FORCE_BUILD && params.DEPLOY
                    }
                }
            }
            steps {
                script {
                    build(
                        job: 'deploy_auth',
                        parameters: [
                            string(name: 'TAG', value: TAG_DEPLOY),
                            string(name: 'ENV', value: params.ENV)
                        ]
                    )
                }
            }
        }
    }

    post {
        cleanup {
            cleanWs()
        }
    }
}
