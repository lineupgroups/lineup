# 🌥️ Cloudinary Setup Guide

## Step 1: Create Account & Get Credentials

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. Go to your **Dashboard** and copy these credentials:
   - **Cloud Name** (e.g., `dxxxxxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (keep this private!)

## Step 2: Update Environment Variables

Add these to your `.env.local` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 3: Create Upload Preset (IMPORTANT!)

1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `lineup_unsigned`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `lineup-projects` (optional)
   - **Allowed formats**: `jpg,jpeg,png,webp`
   - **Max file size**: `5000000` (5MB)
   - **Auto tagging**: Enable if desired
   - **Quality**: `auto:good`
   - **Format**: `auto`
5. Click **Save**

## Step 4: Optional Settings

### Auto-optimization
- **Quality**: `auto:good` (automatically optimizes images)
- **Format**: `auto` (converts to best format like WebP when supported)

### Folder Organization
- All project images will be stored in `lineup-projects/` folder
- Images are tagged with user ID and project ID for easy filtering

### Security
- Upload preset is unsigned for client-side uploads
- You can add additional restrictions like:
  - Max image dimensions
  - Allowed file types
  - Upload rate limits

## Testing

After setup, try uploading an image in your project form. You should see:
- Images uploaded to your Cloudinary account
- URLs starting with `https://res.cloudinary.com/your-cloud-name/`
- Automatic optimization and CDN delivery

## Free Tier Limits

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Admin API calls**: 50,000/month

Perfect for development and small to medium projects!

## Troubleshooting

### "Upload preset not found" error
- Make sure the upload preset is named exactly `lineup_unsigned`
- Ensure it's set to "Unsigned" mode

### CORS errors
- Cloudinary handles CORS automatically, no configuration needed
- If you still see CORS errors, check your browser console for specific details

### Environment variables not working
- Make sure to restart your dev server after adding environment variables
- Check that variables start with `VITE_` prefix
