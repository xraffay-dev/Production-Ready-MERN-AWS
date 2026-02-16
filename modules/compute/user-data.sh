#!/bin/bash
set -e  # Exit on any error

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/user-data.log
}

log "Starting EC2 instance setup..."

# Update all packages
log "Updating system packages..."
sudo yum update -y
sudo yum upgrade -y

# Install Docker
log "Installing Docker..."
sudo yum install docker -y

# Start Docker service
log "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (allows running docker without sudo)
sudo usermod -aG docker ec2-user

# Install Docker Compose (optional but useful)
log "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# AWS Configuration
AWS_ACCOUNT_ID="030046727709"
AWS_REGION="ap-south-1"

log "AWS Account ID: $AWS_ACCOUNT_ID"
log "AWS Region: $AWS_REGION"

# ============================================================================
# Fetch Configuration from SSM Parameter Store
# ============================================================================
log "Fetching configuration from SSM Parameter Store..."

# Fetch parameters from SSM
MONGO_URI=$(aws ssm get-parameter --name "/ec2/config/MONGO_URI" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
FRONTEND_URL=$(aws ssm get-parameter --name "/ec2/config/Frontend_URL" --region $AWS_REGION --query "Parameter.Value" --output text)
PORT=$(aws ssm get-parameter --name "/ec2/config/PORT" --region $AWS_REGION --query "Parameter.Value" --output text)

# Verify parameters were fetched successfully
if [ -z "$MONGO_URI" ] || [ -z "$FRONTEND_URL" ] || [ -z "$PORT" ]; then
    log "ERROR: Failed to fetch one or more parameters from SSM"
    log "MONGO_URI: ${MONGO_URI:+SET} ${MONGO_URI:-NOT SET}"
    log "FRONTEND_URL: ${FRONTEND_URL:+SET} ${FRONTEND_URL:-NOT SET}"
    log "PORT: ${PORT:+SET} ${PORT:-NOT SET}"
    exit 1
fi

log "Configuration fetched successfully from SSM"
log "PORT: $PORT"
log "FRONTEND_URL: $FRONTEND_URL"
log "MONGO_URI: [REDACTED for security]"

# ============================================================================
# Authenticate Docker to ECR and Pull Image
# ============================================================================
log "Authenticating Docker to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

log "Pulling backend image from ECR..."
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/main/mern-on-aws-backend-image:latest

# Verify the image was pulled successfully
docker images | grep mern-on-aws-backend-image

# ============================================================================
# Run Docker Container with Environment Variables from SSM
# ============================================================================
log "Starting Docker container with configuration from SSM..."

# Stop and remove any existing container with the same name
docker stop mern-backend 2>/dev/null || true
docker rm mern-backend 2>/dev/null || true

# Run the container with environment variables from SSM
docker run -d \
  --name mern-backend \
  --restart unless-stopped \
  -p 80:${PORT} \
  -e MONGO_URI="${MONGO_URI}" \
  -e FRONTEND_URL="${FRONTEND_URL}" \
  -e PORT="${PORT}" \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/main/mern-on-aws-backend-image:latest

# Verify container is running
if docker ps | grep -q mern-backend; then
    log "SUCCESS: Docker container 'mern-backend' is running"
    docker ps | grep mern-backend
else
    log "ERROR: Docker container failed to start"
    docker logs mern-backend
    exit 1
fi

log "EC2 instance setup completed successfully!"
