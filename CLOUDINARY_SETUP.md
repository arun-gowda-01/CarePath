# Cloudinary Setup Guide for CarePath

## Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com
2. Click "Sign Up for Free"
3. Fill in your details or sign up with Google/GitHub
4. Verify your email address

## Step 2: Get Your Credentials

1. After logging in, you'll be on the **Dashboard**
2. Look for the "Account Details" section (usually at the top)
3. You'll see three important values:
    ```
    Cloud Name: your_cloud_name
    API Key: 123456789012345
    API Secret: abcdefghijklmnopqrstuvwxyz
    ```

## Step 3: Add to Environment Variables

1. Navigate to `/backend/.env` (create if it doesn't exist)
2. Add these lines:
    ```
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=123456789012345
    CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
    ```
3. Replace with your actual values from Step 2

## Step 4: Configure Upload Preset (Optional)

For better organization:

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click "Add upload preset"
4. Name it: `carepath_checkins`
5. Set folder: `carepath/check-ins`
6. Save

## Step 5: Test the Setup

1. Start your backend server:

    ```bash
    cd backend
    npm run dev
    ```

2. You should see no errors related to Cloudinary

3. Try uploading a wound image through the patient check-in form

4. Check your Cloudinary Media Library to see the uploaded image

## Folder Structure in Cloudinary

Images will be organized as:

```
carepath/
└── check-ins/
    ├── {patientId}/
    │   ├── woundImage-1234567890.jpg
    │   ├── woundImage-1234567891.jpg
    │   └── ...
```

## Free Tier Limits

Cloudinary Free tier includes:

-   **25 GB storage**
-   **25 GB bandwidth/month**
-   **Unlimited transformations**

This is typically sufficient for:

-   ~10,000 check-in images (at 2.5MB average)
-   Small to medium patient populations

## Troubleshooting

### Error: "Invalid cloud_name"

-   Double-check your `CLOUDINARY_CLOUD_NAME` in `.env`
-   Make sure there are no extra spaces

### Error: "Invalid API credentials"

-   Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`
-   Regenerate credentials if needed (Settings → Security)

### Images not uploading

-   Check if `/backend/uploads/temp/` directory exists
-   Verify file permissions
-   Check backend console for detailed errors

### Images not displaying

-   Check if image URL is saved in database
-   Verify CORS settings if accessing from different domain
-   Ensure Cloudinary account is active

## Security Best Practices

1. **Never commit `.env` to Git**

    ```bash
    # Already in .gitignore
    echo ".env" >> .gitignore
    ```

2. **Use different Cloudinary accounts for development/production**

    - Dev: `carepath-dev`
    - Production: `carepath-prod`

3. **Enable Upload restrictions**

    - Settings → Security → Allowed file types: `jpg, png, webp`
    - Max file size: `5MB`

4. **Monitor usage**
    - Dashboard → Analytics
    - Set up alerts for approaching limits

## Alternative: Using Cloudinary CLI

For bulk operations or testing:

```bash
# Install Cloudinary CLI
npm install -g cloudinary-cli

# Login
cld config:set cloud_name=your_cloud_name api_key=your_key api_secret=your_secret

# Upload test image
cld uploader upload test.jpg -f carepath/check-ins

# List all images
cld admin:search -q "folder:carepath/*"
```

## Production Considerations

1. **Enable Cloudinary AI features** (optional):

    - Automatic moderation
    - Quality analysis
    - Background removal

2. **Set up transformation presets**:

    - Thumbnail: 200x200
    - Preview: 800x800
    - Full: 1200x1200

3. **Configure CDN settings**:
    - Enable HTTP/2
    - Set cache headers
    - Use custom domain (Pro plan)

---

**Setup Complete!** 🎉

Your CarePath system is now ready to handle wound image uploads via Cloudinary.
