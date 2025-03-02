# Dockerfile using Node 20 with AWS CLI installed via curl
# This Dockerfile integrates the core functionality of the original bash script.
# It requires the following build arguments (all mandatory):
#
#   AWS_ACCESS_KEY_ID     - AWS access key ID.
#   AWS_SECRET_ACCESS_KEY - AWS secret access key.
#   REGION                - AWS region.
#   REGISTRY_URL          - CodeArtifact registry URL.
#   REGISTRY_ENDPOINT     - CodeArtifact registry endpoint.
#   DOMAIN_OWNER          - CodeArtifact domain owner.
#   OAUTH2_VERSION        - OAuth2 version.
#   REPOSITORY_NAME       - CodeArtifact repository name.
#
# All parameters must be provided via --build-arg during the build.

FROM node:20

# Build arguments (all mandatory)
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG REGION
ARG REGISTRY_URL
ARG REGISTRY_ENDPOINT
ARG DOMAIN_OWNER
ARG OAUTH2_VERSION
ARG REPOSITORY_NAME

# Set environment variables for AWS CLI configuration
ENV aws_access_key_id=${AWS_ACCESS_KEY_ID} 
ENV aws_secret_access_key=${AWS_SECRET_ACCESS_KEY} 
ENV aws_default_region=${REGION} 
ENV registry_url=${REGISTRY_URL} 
ENV registry_endpoint=${REGISTRY_ENDPOINT} 
ENV domain_owner=${DOMAIN_OWNER} 
ENV oauth2_version=${OAUTH2_VERSION} 
ENV repository_name=${REPOSITORY_NAME} 

# Install AWS CLI using curl 
RUN apt-get update 
RUN  apt-get install -y curl unzip bash
RUN  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" 
RUN  unzip -q awscliv2.zip 
RUN  ./aws/install 
RUN  rm -rf awscliv2.zip aws
RUN  rm -rf /var/lib/apt/lists/*

# Remove any existing npm configuration
RUN rm -f /root/.npmrc

# Set working directory
WORKDIR /app

# Copy project files
COPY oauth2-client.tar /app
RUN tar xf oauth2-client.tar
RUN chmod -R 777 *
RUN git config --global --add safe.directory /app
RUN git config --global user.email "nobody@nowhere.com"
RUN git config --global user.name "John Doe"

#Changing package version
RUN export oauth2_version=${OAUTH2_VERSION}
RUN npm version ${oauth2_version}
#RUN git checkout -b "temp"
RUN npm install ; npm run prepublishOnly

# Retrieve CodeArtifact authorization token, log in to CodeArtifact,
# configure npm authentication, and publish the package.
RUN CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain gtec --domain-owner ${domain_owner} --region ${aws_default_region} --query authorizationToken --output text)
RUN CODEARTIFACT_ENDPOINT=${REGISTRY_ENDPOINT} 
RUN aws codeartifact login --tool npm --repository ${repository_name} --domain gtec --domain-owner ${domain_owner} --region ${aws_default_region} 
RUN HOST=$(echo ${registry_url} | sed 's~https://~~') 
RUN npm config set //"${HOST}":_authToken=${CODEARTIFACT_AUTH_TOKEN} 
RUN npm config set registry ${registry_url} 
RUN npm publish --registry ${registry_url}
