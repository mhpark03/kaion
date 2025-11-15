# AWS CloudFront Setup Guide

## Why CloudFront?

Using CloudFront instead of direct S3 URLs provides:

1. **Fixed URL**: CloudFront domain doesn't change (`d1234567890.cloudfront.net`)
2. **HTTPS Support**: Automatic SSL/TLS encryption
3. **Better Performance**: Global edge locations cache your content
4. **Custom Domain**: Use your own domain (e.g., `app.yourdomain.com`)
5. **Cost Effective**: Free tier includes 1TB data transfer/month

## Problem: S3 URL Changes Frequently

Current S3 URL pattern:
```
http://kiosk-frontend-20251018.s3-website.ap-northeast-2.amazonaws.com
       ^^^^^^^^^^^^^^^^^^^^^^
       This part changes when you create new buckets!
```

Every time you create a new S3 bucket, you need to:
1. Update `CORS_ALLOWED_ORIGINS` in backend
2. Redeploy or restart backend
3. Update `.env.production` in frontend

## Solution: CloudFront Distribution

With CloudFront, your URL stays the same:
```
https://d1234567890.cloudfront.net  (never changes)
```

Or with custom domain:
```
https://app.yourdomain.com  (your permanent domain)
```

## Setup Instructions

### Step 1: Create CloudFront Distribution

1. **Open CloudFront Console**
   - Go to AWS Console → CloudFront → Create Distribution

2. **Origin Settings**
   - **Origin Domain**: Select your S3 bucket (`kiosk-frontend-20251018.s3.ap-northeast-2.amazonaws.com`)
   - **Origin Path**: Leave empty
   - **Name**: `S3-kiosk-frontend` (or any name)
   - **Origin Access**: Select "Origin access control settings (recommended)"
   - Click "Create control setting" if needed

3. **Default Cache Behavior**
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS (or GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE if using API)
   - **Cache Policy**: CachingOptimized
   - **Origin Request Policy**: CORS-S3Origin

4. **Settings**
   - **Price Class**: Use all edge locations (or select regions based on your users)
   - **Alternate Domain Names (CNAMEs)**: Leave empty for now (or add your custom domain)
   - **Custom SSL Certificate**: Use default CloudFront certificate
   - **Default Root Object**: `index.html`

5. **Create Distribution**
   - Click "Create Distribution"
   - Wait 5-10 minutes for deployment (Status: "Enabled")

### Step 2: Configure S3 Bucket Policy

CloudFront needs permission to access your S3 bucket.

1. **Copy the Policy Statement**
   - In CloudFront console, click your distribution
   - Go to "Origins" tab
   - Click on your origin, then "Edit"
   - Copy the suggested bucket policy

2. **Update S3 Bucket Policy**
   - Go to S3 console → Your bucket → Permissions → Bucket Policy
   - Add the CloudFront policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalReadOnly",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::kiosk-frontend-20251018/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
                }
            }
        }
    ]
}
```

Replace:
- `kiosk-frontend-20251018` with your bucket name
- `YOUR_ACCOUNT_ID` with your AWS account ID
- `YOUR_DISTRIBUTION_ID` with your CloudFront distribution ID

### Step 3: Update Frontend Build Configuration

**Update `.env.production`:**

```bash
# OLD (S3 direct URL - changes frequently)
# VITE_API_BASE_URL=https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com/api

# NEW (Use backend ElasticBeanstalk URL or CloudFront URL)
VITE_API_BASE_URL=https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com/api
```

**Note**: Frontend now served via CloudFront, but still calls backend directly.

### Step 4: Update Backend CORS Configuration

**Update Elastic Beanstalk Environment Variable:**

1. Go to **Elastic Beanstalk Console**
2. Select `kiosk-backend-prod-v2` environment
3. Configuration → Software → Edit
4. Add/Update environment property:

```
Name: CORS_ALLOWED_ORIGINS
Value: http://localhost:5174,https://d1234567890.cloudfront.net
```

Replace `d1234567890.cloudfront.net` with your actual CloudFront domain name.

**Important**: Use `https://` not `http://` for CloudFront URLs!

### Step 5: Update Deployment Workflow

**Update `.github/workflows/deploy.yml` frontend deployment:**

```yaml
- name: Deploy to S3
  run: |
    aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete

- name: Invalidate CloudFront Cache
  env:
    CLOUDFRONT_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
  run: |
    if [ -n "$CLOUDFRONT_ID" ]; then
      echo "Invalidating CloudFront distribution: $CLOUDFRONT_ID"
      aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/*"
    else
      echo "CloudFront distribution ID not configured, skipping cache invalidation"
    fi
```

**Add GitHub Secret:**
1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Add new secret:
   - Name: `CLOUDFRONT_DISTRIBUTION_ID`
   - Value: `E1234567890ABC` (your distribution ID from CloudFront console)

### Step 6: Configure Error Pages (Important!)

React apps need custom error pages to handle client-side routing.

1. **In CloudFront Console**:
   - Select your distribution → Error Pages tab
   - Create Custom Error Response:
     - **HTTP Error Code**: 403 (Forbidden)
     - **Customize Error Response**: Yes
     - **Response Page Path**: `/index.html`
     - **HTTP Response Code**: 200 (OK)
   - Create another for 404:
     - **HTTP Error Code**: 404 (Not Found)
     - **Response Page Path**: `/index.html`
     - **HTTP Response Code**: 200 (OK)

This ensures React Router can handle URLs like `/dashboard`, `/questions`, etc.

## Optional: Add Custom Domain

### Prerequisites
- Own a domain (register via Route 53 or external registrar)
- Domain DNS managed by Route 53

### Steps

1. **Request SSL Certificate (ACM)**
   - Go to AWS Certificate Manager (must be in **us-east-1** region for CloudFront!)
   - Request public certificate
   - Domain name: `app.yourdomain.com` (or `*.yourdomain.com` for wildcard)
   - Validation: DNS validation (recommended)
   - Add CNAME records to Route 53 for validation
   - Wait for certificate status: "Issued"

2. **Update CloudFront Distribution**
   - Edit distribution settings
   - **Alternate Domain Names (CNAMEs)**: Add `app.yourdomain.com`
   - **Custom SSL Certificate**: Select your ACM certificate
   - Save changes

3. **Create Route 53 Record**
   - Go to Route 53 → Hosted Zones → Your domain
   - Create Record:
     - **Record name**: `app` (for `app.yourdomain.com`)
     - **Record type**: A (IPv4 address)
     - **Alias**: Yes
     - **Route traffic to**: Alias to CloudFront distribution
     - **Distribution**: Select your CloudFront distribution
     - Create record

4. **Update CORS Configuration**
   ```bash
   CORS_ALLOWED_ORIGINS=http://localhost:5174,https://app.yourdomain.com
   ```

5. **Update `.env.production`**
   ```bash
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   # Or keep using Elastic Beanstalk URL
   VITE_API_BASE_URL=https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com/api
   ```

## Testing

### 1. Test CloudFront Distribution

```bash
# Test CloudFront URL
curl -I https://d1234567890.cloudfront.net

# Should return:
HTTP/2 200
content-type: text/html
x-cache: Hit from cloudfront  # or "Miss from cloudfront" on first request
```

### 2. Test CORS

```bash
# Test CORS preflight
curl -H "Origin: https://d1234567890.cloudfront.net" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com/api/levels -v

# Should include in response:
Access-Control-Allow-Origin: https://d1234567890.cloudfront.net
Access-Control-Allow-Credentials: true
```

### 3. Test Application

1. Open browser to CloudFront URL: `https://d1234567890.cloudfront.net`
2. Open DevTools → Network tab
3. Login and navigate the app
4. Verify no CORS errors
5. Check that API calls succeed

## Cost Estimation

### CloudFront Pricing (as of 2024)

**Free Tier (12 months):**
- 1 TB data transfer out
- 10,000,000 HTTP/HTTPS requests
- 2,000,000 CloudFront Function invocations

**After Free Tier:**
- Data transfer: ~$0.085/GB (first 10 TB)
- HTTPS requests: $0.0100 per 10,000 requests

**Example Monthly Cost** (10,000 users, 100 MB/user):
- Data transfer: 1 TB = ~$85/month
- Requests: 1M requests = ~$1/month
- **Total**: ~$86/month

**For small apps** (< 1TB/month): Essentially free!

## Troubleshooting

### CloudFront Returns 403 Forbidden

**Cause**: S3 bucket policy doesn't allow CloudFront access

**Solution**:
1. Check S3 bucket policy includes CloudFront principal
2. Verify distribution ID matches policy
3. Ensure S3 "Block Public Access" is configured correctly

### CORS Errors Still Occur

**Cause**: Backend `CORS_ALLOWED_ORIGINS` not updated with CloudFront URL

**Solution**:
1. Check backend logs for "CORS Configuration Initialized"
2. Ensure CloudFront URL exactly matches (https://, no trailing slash)
3. Restart backend if needed

### CloudFront Serves Old Content

**Cause**: CloudFront cache not invalidated after deployment

**Solution**:
1. Create invalidation in CloudFront console: `/*`
2. Or add invalidation to deployment workflow (already included above)

### Custom Domain Shows "Site Cannot Be Reached"

**Cause**: DNS not propagated or Route 53 record incorrect

**Solution**:
1. Check Route 53 record points to correct CloudFront distribution
2. Wait 5-10 minutes for DNS propagation
3. Test with `dig app.yourdomain.com` or `nslookup app.yourdomain.com`

## Summary

| Aspect | S3 Direct URL | CloudFront | CloudFront + Custom Domain |
|--------|--------------|-----------|---------------------------|
| URL Stability | ❌ Changes with bucket | ✅ Fixed | ✅ Fixed |
| HTTPS | ❌ No | ✅ Yes | ✅ Yes |
| Performance | ⚠️ Moderate | ✅ Fast (CDN) | ✅ Fast (CDN) |
| Cost | ✅ Free | ✅ Free tier | ⚠️ Domain cost (~$12/year) |
| Setup Complexity | ✅ Easy | ⚠️ Moderate | ⚠️ Moderate |
| Professional | ❌ No | ⚠️ Moderate | ✅ Yes |

**Recommendation**: Use CloudFront for production, even without custom domain. It provides stability, security, and performance at minimal cost.
