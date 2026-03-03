#!/bin/bash
set -e  # Exit on any error

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/user-data.log
}

log "Starting EC2 instance setup..."

# # Update all packages
# log "Updating system packages..."
# sudo yum update -y
# sudo yum upgrade -y

# # Install Docker
# log "Installing Docker..."
# sudo yum install docker -y

# # Start Docker service
# log "Starting Docker service..."
# sudo systemctl start docker
# sudo systemctl enable docker

# # Add ec2-user to docker group (allows running docker without sudo)
# sudo usermod -aG docker ec2-user

# # Install Docker Compose (optional but useful)
# log "Installing Docker Compose..."
# sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# sudo chmod +x /usr/local/bin/docker-compose

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

# Fetch DocumentDB URI (replaces old MongoDB Atlas URI)
DOCDB_URI=$(aws ssm get-parameter --name "/ec2/config/DOCDB_URI" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
FRONTEND_URL=$(aws ssm get-parameter --name "/ec2/config/Frontend_URL" --region $AWS_REGION --query "Parameter.Value" --output text)
PORT=$(aws ssm get-parameter --name "/ec2/config/PORT" --region $AWS_REGION --query "Parameter.Value" --output text)
DOCDB_CERT_BUCKET=$(aws ssm get-parameter --name "/ec2/config/DOCDB_CERT_BUCKET" --region $AWS_REGION --query "Parameter.Value" --output text)

# Verify parameters were fetched successfully
if [ -z "$DOCDB_URI" ] || [ -z "$FRONTEND_URL" ] || [ -z "$PORT" ] || [ -z "$DOCDB_CERT_BUCKET" ]; then
    log "ERROR: Failed to fetch one or more parameters from SSM"
    log "DOCDB_URI: ${DOCDB_URI:+SET} ${DOCDB_URI:-NOT SET}"
    log "FRONTEND_URL: ${FRONTEND_URL:+SET} ${FRONTEND_URL:-NOT SET}"
    log "PORT: ${PORT:+SET} ${PORT:-NOT SET}"
    log "DOCDB_CERT_BUCKET: ${DOCDB_CERT_BUCKET:+SET} ${DOCDB_CERT_BUCKET:-NOT SET}"
    exit 1
fi

log "Configuration fetched successfully from SSM"
log "PORT: $PORT"
log "FRONTEND_URL: $FRONTEND_URL"
log "DOCDB_URI: [REDACTED for security]"
log "DOCDB_CERT_BUCKET: $DOCDB_CERT_BUCKET"

# ============================================================================
# Download DocumentDB TLS Certificate from S3
# ============================================================================
# The global-bundle.pem is stored in S3 (too large for SSM's 4KB limit).
# Traffic goes through the S3 VPC Gateway Endpoint — no internet needed.
log "Downloading DocumentDB TLS certificate from S3..."

CERT_PATH="/home/ec2-user/global-bundle.pem"
aws s3 cp "s3://${DOCDB_CERT_BUCKET}/certs/global-bundle.pem" "$CERT_PATH" --region $AWS_REGION

if [ ! -f "$CERT_PATH" ]; then
    log "ERROR: Failed to download TLS certificate from S3"
    exit 1
fi

chmod 644 "$CERT_PATH"
log "TLS certificate downloaded to $CERT_PATH"

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
# Run Docker Container with DocumentDB Configuration
# ============================================================================
log "Starting Docker container with DocumentDB configuration..."

# Stop and remove any existing container with the same name
docker stop mern-backend 2>/dev/null || true
docker rm mern-backend 2>/dev/null || true

# Run the container with:
#   - DOCDB_URI passed as MONGO_URI env var (app still uses MONGO_URI internally)
#   - TLS cert mounted from host into the container at the same path
#     referenced in the connection string
docker run -d \
  --name mern-backend \
  --restart unless-stopped \
  -p 8000:${PORT} \
  -e MONGO_URI="${DOCDB_URI}" \
  -e FRONTEND_URL="${FRONTEND_URL}" \
  -e PORT="${PORT}" \
  -v ${CERT_PATH}:${CERT_PATH}:ro \
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
