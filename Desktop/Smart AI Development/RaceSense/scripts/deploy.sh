#!/bin/bash

# RaceSense Production Deployment Script
# Comprehensive deployment automation for multiple platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="RaceSense"
VERSION="1.2.0"
BUILD_DIR="dist"
BACKUP_DIR="deployment-backups"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Display banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║           RaceSense Deployment           ║"
echo "║        Professional Racing Platform      ║"
echo "║              Version $VERSION               ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --production=false
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    npm run test
    success "All tests passed"
}

# Run type checking
type_check() {
    log "Running TypeScript type checking..."
    npm run typecheck
    success "Type checking passed"
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Clean previous build
    rm -rf $BUILD_DIR
    
    # Set production environment
    export NODE_ENV=production
    export VITE_APP_ENVIRONMENT=production
    
    # Build
    npm run build
    
    # Verify build
    if [ ! -d "$BUILD_DIR" ]; then
        error "Build failed - dist directory not found"
    fi
    
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        error "Build failed - index.html not found"
    fi
    
    success "Application built successfully"
}

# Optimize build
optimize_build() {
    log "Optimizing build..."
    
    # Compress assets if gzip is available
    if command -v gzip &> /dev/null; then
        find $BUILD_DIR -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
        success "Assets compressed with gzip"
    fi
    
    # Generate build report
    echo "Build Size Report:" > $BUILD_DIR/build-report.txt
    echo "==================" >> $BUILD_DIR/build-report.txt
    du -sh $BUILD_DIR >> $BUILD_DIR/build-report.txt
    echo "" >> $BUILD_DIR/build-report.txt
    echo "Individual Assets:" >> $BUILD_DIR/build-report.txt
    find $BUILD_DIR -type f -name "*.js" -o -name "*.css" | xargs ls -lah >> $BUILD_DIR/build-report.txt
    
    success "Build optimized"
}

# Create backup
create_backup() {
    if [ "$1" = "true" ]; then
        log "Creating deployment backup..."
        
        mkdir -p $BACKUP_DIR
        BACKUP_NAME="racesense-backup-$(date +%Y%m%d-%H%M%S)"
        
        # Create backup archive
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
            --exclude=node_modules \
            --exclude=.git \
            --exclude=dist \
            --exclude=$BACKUP_DIR \
            .
        
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    log "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        warning "Netlify CLI not found, installing..."
        npm install -g netlify-cli
    fi
    
    # Deploy
    netlify deploy --prod --dir=$BUILD_DIR
    
    success "Deployed to Netlify"
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        warning "Vercel CLI not found, installing..."
        npm install -g vercel
    fi
    
    # Deploy
    vercel --prod
    
    success "Deployed to Vercel"
}

# Deploy to AWS S3
deploy_aws() {
    log "Deploying to AWS S3..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install AWS CLI first."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    # Get bucket name from environment or prompt
    if [ -z "$AWS_BUCKET" ]; then
        read -p "Enter S3 bucket name: " AWS_BUCKET
    fi
    
    # Sync to S3
    aws s3 sync $BUILD_DIR s3://$AWS_BUCKET --delete
    
    # Invalidate CloudFront if distribution ID provided
    if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
            --paths "/*"
    fi
    
    success "Deployed to AWS S3"
}

# Post-deployment checks
post_deployment_checks() {
    log "Running post-deployment checks..."
    
    # Check if URL is provided
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        # Basic health check
        if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
            success "Health check passed - $DEPLOYMENT_URL is responding"
        else
            warning "Health check failed - $DEPLOYMENT_URL is not responding"
        fi
        
        # Check PWA manifest
        if curl -f -s "$DEPLOYMENT_URL/manifest.json" > /dev/null; then
            success "PWA manifest accessible"
        else
            warning "PWA manifest not accessible"
        fi
        
        # Check service worker
        if curl -f -s "$DEPLOYMENT_URL/sw.js" > /dev/null; then
            success "Service worker accessible"
        else
            warning "Service worker not accessible"
        fi
    fi
}

# Clean up
cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    rm -f .env.production.local
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    local platform=$1
    local create_backup_flag=${2:-false}
    
    log "Starting deployment to $platform..."
    
    check_prerequisites
    install_dependencies
    run_tests
    type_check
    create_backup $create_backup_flag
    build_application
    optimize_build
    
    case $platform in
        "netlify")
            deploy_netlify
            DEPLOYMENT_URL="https://racesense.netlify.app"
            ;;
        "vercel")
            deploy_vercel
            DEPLOYMENT_URL="https://racesense.vercel.app"
            ;;
        "aws")
            deploy_aws
            DEPLOYMENT_URL="https://racesense.app"
            ;;
        "all")
            deploy_netlify
            deploy_vercel
            deploy_aws
            DEPLOYMENT_URL="https://racesense.app"
            ;;
        *)
            error "Unknown platform: $platform. Use 'netlify', 'vercel', 'aws', or 'all'"
            ;;
    esac
    
    post_deployment_checks
    cleanup
    
    success "Deployment to $platform completed successfully!"
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo ""
        echo -e "${GREEN}🚀 RaceSense is now live at: ${BLUE}$DEPLOYMENT_URL${NC}"
        echo ""
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [platform] [options]"
    echo ""
    echo "Platforms:"
    echo "  netlify  Deploy to Netlify"
    echo "  vercel   Deploy to Vercel"
    echo "  aws      Deploy to AWS S3 + CloudFront"
    echo "  all      Deploy to all platforms"
    echo ""
    echo "Options:"
    echo "  --backup Create backup before deployment"
    echo "  --help   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 netlify"
    echo "  $0 aws --backup"
    echo "  $0 all --backup"
}

# Parse command line arguments
PLATFORM=""
CREATE_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        netlify|vercel|aws|all)
            PLATFORM="$1"
            shift
            ;;
        --backup)
            CREATE_BACKUP=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Check if platform is specified
if [ -z "$PLATFORM" ]; then
    echo "Please specify a deployment platform."
    echo ""
    show_help
    exit 1
fi

# Start deployment
deploy $PLATFORM $CREATE_BACKUP
