# RaceSense Production Deployment Guide

> **Note:** The TrackCreator is now sector-only. Users can add, edit, and remove sectors directly on the map. Point-based editing is no longer supported. See BACKUP/03_Tracks_Database_Complete.md for details.

## 🏁 Overview

RaceSense is a professional racing telemetry platform built with modern web technologies. This guide covers comprehensive production deployment strategies across multiple platforms.

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Docker**: Latest version (for containerized deployment)

### Platform Accounts

- **Netlify** account with authentication token
- **Vercel** account with CLI access
- **AWS** account with S3 and CloudFront access
- **GitHub** account for CI/CD

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd racesense
npm install
```

### 2. Environment Configuration

Copy the production environment template:

```bash
cp .env.production .env.local
```

Update the variables in `.env.local` with your specific values.

### 3. Build and Test

```bash
npm run build
npm run test
npm run typecheck
```

### 4. Deploy

```bash
# Deploy to specific platform
./scripts/deploy.sh netlify
./scripts/deploy.sh vercel
./scripts/deploy.sh aws

# Deploy to all platforms
./scripts/deploy.sh all --backup
```

## 🌐 Deployment Platforms

### Netlify Deployment

**Automatic (Recommended)**

- Connect GitHub repository to Netlify
- Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
- Set environment variables in Netlify dashboard

**Manual**

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Vercel Deployment

**Automatic (Recommended)**

- Install Vercel GitHub app
- Import repository from dashboard
- Configure build settings automatically detected

**Manual**

```bash
npm install -g vercel
vercel login
vercel --prod
```

### AWS Deployment

**Prerequisites**

- S3 bucket for static hosting
- CloudFront distribution
- Route 53 hosted zone (optional)
- AWS CLI configured

**Deploy using CloudFormation**

```bash
aws cloudformation deploy \
  --template-file aws-deploy.yml \
  --stack-name racesense-production \
  --parameter-overrides \
    DomainName=racesense.app \
    CertificateArn=arn:aws:acm:us-east-1:...:certificate/... \
  --capabilities CAPABILITY_IAM
```

**Manual S3 deployment**

```bash
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t racesense:latest .
```

### Run Container

```bash
docker run -d \
  --name racesense \
  -p 80:80 \
  --restart unless-stopped \
  racesense:latest
```

### Docker Compose

```yaml
version: "3.8"
services:
  racesense:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## ⚙️ Environment Variables

### Required Variables

```bash
VITE_APP_NAME=RaceSense
VITE_APP_VERSION=1.2.0
VITE_APP_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.racesense.app
```

### Optional Variables

```bash
VITE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project
VITE_WEATHER_API_KEY=your-weather-api-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow

The included workflow (`.github/workflows/deploy.yml`) provides:

- Automated testing and quality checks
- Multi-platform deployment
- Performance monitoring with Lighthouse
- Security scanning
- Deployment notifications

### Workflow Triggers

- **Push to main**: Deploy to all platforms
- **Pull requests**: Run tests only
- **Manual trigger**: Deploy to specific platform

### Required Secrets

```
# Netlify
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID

# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# AWS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
AWS_CLOUDFRONT_DISTRIBUTION_ID

# Analytics
LHCI_GITHUB_APP_TOKEN
```

## 📊 Performance Monitoring

### Lighthouse CI

Automated performance monitoring with predefined budgets:

- **Performance**: > 80%
- **Accessibility**: > 90%
- **Best Practices**: > 80%
- **SEO**: > 80%
- **PWA**: > 80%

### Core Web Vitals Targets

- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Bundle Size Limits

- **Total Bundle**: < 2MB
- **JavaScript**: < 1.5MB
- **CSS**: < 500KB

## 🔒 Security Configuration

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict Transport Security (HSTS)

### Rate Limiting

- API endpoints: 10 requests/second
- Authentication: 1 request/minute
- General: Burst protection enabled

## 🛠️ Troubleshooting

### Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Performance Issues

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Deployment Issues

```bash
# Check deployment logs
./scripts/deploy.sh netlify 2>&1 | tee deployment.log
```

## 📈 Post-Deployment Checklist

### Functionality Testing

- [ ] Application loads successfully
- [ ] All routes are accessible
- [ ] PWA features work offline
- [ ] Real-time telemetry connects
- [ ] Data export functions properly

### Performance Validation

- [ ] Lighthouse scores meet targets
- [ ] Bundle sizes within limits
- [ ] Core Web Vitals pass
- [ ] Loading times acceptable

### Security Verification

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No console errors
- [ ] CSP violations resolved

### Monitoring Setup

- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring active

## 🔄 Rollback Procedures

### Quick Rollback

```bash
# Netlify
netlify rollback

# Vercel
vercel rollback

# AWS
aws s3 sync s3://backup-bucket/ s3://production-bucket/
```

### Full Restoration

```bash
# From backup
tar -xzf deployment-backups/racesense-backup-YYYYMMDD-HHMMSS.tar.gz
./scripts/deploy.sh all
```

## 📞 Support

### Emergency Contacts

- **DevOps Team**: devops@racesense.app
- **Platform Issues**: support@racesense.app
- **Security Issues**: security@racesense.app

### Monitoring Dashboards

- **Status Page**: https://status.racesense.app
- **Performance**: https://lighthouse.racesense.app
- **Error Tracking**: https://sentry.io/racesense

## 📚 Additional Resources

- [RaceSense Documentation](https://docs.racesense.app)
- [API Reference](https://api.racesense.app/docs)
- [Performance Guide](https://docs.racesense.app/performance)
- [Security Guidelines](https://docs.racesense.app/security)

---

**Last Updated**: December 2024  
**Version**: 1.2.0  
**Maintainer**: RaceSense DevOps Team
