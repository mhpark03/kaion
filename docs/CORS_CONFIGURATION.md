# CORS Configuration Guide

## Overview

This guide explains how to manage CORS (Cross-Origin Resource Sharing) configuration across different environments (local, development, production) without code changes.

## Current Architecture

### Backend Configuration

**File**: `backend/src/main/java/com/edutest/config/SecurityConfig.java`

```java
@Value("${cors.allowed-origins:http://localhost:5174}")
private String allowedOrigins;
```

**File**: `backend/src/main/resources/application.yml`

```yaml
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5174,http://kiosk-frontend-20251018.s3-website.ap-northeast-2.amazonaws.com}
```

### Configuration Priority

1. **Environment Variable** `CORS_ALLOWED_ORIGINS` (highest priority)
2. **application.yml** `cors.allowed-origins`
3. **Default** in `@Value` annotation

## Environment Setup

### 1. Local Development

**No configuration needed** - uses default `http://localhost:5174`

To test with custom URL:
```bash
export CORS_ALLOWED_ORIGINS=http://localhost:5174,http://localhost:3000
./gradlew bootRun
```

### 2. AWS Elastic Beanstalk (Development/Production)

#### Method A: AWS Console (Recommended)

1. Navigate to **Elastic Beanstalk Console**
2. Select your environment (e.g., `kiosk-backend-prod-v2`)
3. Go to **Configuration** → **Software** → **Edit**
4. Under **Environment properties**, add:
   ```
   Name: CORS_ALLOWED_ORIGINS
   Value: http://localhost:5174,http://kiosk-frontend-dev.s3-website.ap-northeast-2.amazonaws.com,http://kiosk-frontend-prod.s3-website.ap-northeast-2.amazonaws.com
   ```
5. Click **Apply**

**Advantages:**
- No deployment required - changes apply immediately
- Environment-specific configuration
- No code changes needed when frontend URL changes

#### Method B: EB CLI

```bash
eb setenv CORS_ALLOWED_ORIGINS="http://localhost:5174,http://your-frontend-url.com"
```

#### Method C: `.ebextensions` Configuration File

Create `backend/.ebextensions/environment.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    CORS_ALLOWED_ORIGINS: "http://localhost:5174,http://kiosk-frontend-dev.s3-website.ap-northeast-2.amazonaws.com"
```

**Note**: This requires deployment to update.

## URL Format Examples

### Multiple Origins (Comma-Separated)

```bash
CORS_ALLOWED_ORIGINS=http://localhost:5174,http://dev.example.com,https://prod.example.com
```

### Wildcard Patterns (Use Carefully)

```bash
# Allow all S3 websites in ap-northeast-2
CORS_ALLOWED_ORIGINS=http://*.s3-website.ap-northeast-2.amazonaws.com

# Allow all subdomains
CORS_ALLOWED_ORIGINS=https://*.yourdomain.com
```

**Warning**: Wildcards reduce security. Use specific URLs when possible.

## Debugging CORS Issues

### 1. Check Current Configuration

When the application starts, check the logs for:

```
=================================================
CORS Configuration Initialized
Allowed Origins: http://localhost:5174,http://...
Allowed Origins (split): [http://localhost:5174, http://...]
=================================================
```

### 2. CloudWatch Logs (AWS)

1. Go to **Elastic Beanstalk Console** → **Logs** → **Request Logs**
2. Download full logs
3. Search for `CORS Configuration Initialized`

### 3. Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error despite setting URL | URL mismatch (http vs https, trailing slash) | Ensure exact match, no trailing slashes |
| Changes not applied | Old configuration cached | Restart environment or redeploy |
| Wildcard `*` rejected | Used with `credentials: true` | Use specific URLs or patterns |

## Recommended Architecture

### Short-Term (Current)

✅ **Use Environment Variables**
- Set `CORS_ALLOWED_ORIGINS` in Elastic Beanstalk
- Update via AWS Console when URLs change
- No code deployment needed

### Mid-Term (Recommended for Production)

✅ **Add CloudFront Distribution**

Benefits:
- **Fixed URL**: CloudFront domain doesn't change
- **HTTPS**: Secure connections
- **Caching**: Faster load times
- **Custom Domain**: Use your own domain (e.g., `app.yourdomain.com`)

Setup:
1. Create CloudFront distribution pointing to S3 bucket
2. Update `CORS_ALLOWED_ORIGINS` to CloudFront URL
3. (Optional) Add custom domain via Route 53

Example:
```bash
CORS_ALLOWED_ORIGINS=https://d1234567890.cloudfront.net,https://app.yourdomain.com
```

### Long-Term (Production-Ready)

✅ **Custom Domain with Route 53**

Benefits:
- **Professional URLs**: `https://app.yourdomain.com`, `https://api.yourdomain.com`
- **URL Stability**: Never changes
- **SSL Certificates**: Free with AWS Certificate Manager
- **Environment Separation**: `dev.yourdomain.com`, `www.yourdomain.com`

Setup:
1. Register domain (Route 53 or external)
2. Create CloudFront distributions for frontend and backend
3. Add CNAME records in Route 53
4. Update CORS configuration:
   ```bash
   CORS_ALLOWED_ORIGINS=https://app.yourdomain.com,https://dev.yourdomain.com
   ```

## Environment-Specific Configuration

### Development Environment

```bash
# Elastic Beanstalk environment: kiosk-backend-dev
CORS_ALLOWED_ORIGINS=http://localhost:5174,http://kiosk-frontend-dev.s3-website.ap-northeast-2.amazonaws.com
```

### Production Environment

```bash
# Elastic Beanstalk environment: kiosk-backend-prod-v2
CORS_ALLOWED_ORIGINS=https://d1234567890.cloudfront.net,https://app.yourdomain.com
```

## Updating Frontend URL

### When S3 Bucket Changes

**Without Code Changes:**

1. Update environment variable in Elastic Beanstalk Console
2. Wait 1-2 minutes for configuration to propagate
3. Test with new URL

**With Code Changes (Not Recommended):**

1. Update `backend/src/main/resources/application.yml`
2. Commit and deploy
3. Longer downtime, requires full deployment

## Security Best Practices

1. ✅ **Use specific URLs** instead of wildcards when possible
2. ✅ **Use HTTPS** in production (via CloudFront)
3. ✅ **Separate environments** (different URLs for dev/prod)
4. ✅ **Review logs** regularly to catch unauthorized requests
5. ❌ **Never use `*`** with `credentials: true` (will fail)
6. ❌ **Don't commit** production URLs to public repositories

## Quick Reference

| Environment | CORS Setting Method | Update Time |
|-------------|-------------------|-------------|
| Local | Default or export variable | Immediate (restart app) |
| AWS Dev | EB Console Environment Properties | 1-2 minutes |
| AWS Prod | EB Console Environment Properties | 1-2 minutes |
| With CloudFront | EB Console (CloudFront URL) | 1-2 minutes |

## Troubleshooting Commands

```bash
# Check current EB environment variables
eb printenv

# View application logs
eb logs

# SSH into instance and check environment
eb ssh
echo $CORS_ALLOWED_ORIGINS

# Test CORS from command line
curl -H "Origin: http://your-frontend-url.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend-url.com/api/levels -v
```

## Support

If CORS issues persist:
1. Check CloudWatch logs for startup configuration
2. Verify environment variables are set correctly
3. Ensure frontend URL exactly matches (no trailing slash, correct protocol)
4. Test with `curl` to isolate browser vs server issues
