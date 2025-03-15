# Implementation Plan for Adding Image Upload to the Web App

## 1. Create the necessary utilities

First, we need to port the utility functions from the mobile app to the web app:

1. Create the `BlossomClient` and related utilities in the web app's utils directory
2. Implement a web version of the `Uploader` class that works with browser File objects
3. Add functions to calculate SHA256 hashes for files in the browser

## 2. Enhance the post creation dialog

1. Update the existing post creation dialog in `apps/web/src/lib/components/Sidebar.svelte` to:
   - Support multiple image selection
   - Add a caption/text field
   - Show thumbnails of selected images
   - Add progress indicators for uploads
   - Improve the overall UI and UX

## 3. Add server-side route handler for post creation

1. Create a new `+page.server.ts` file in the app routes directory to handle form submissions
2. Implement the necessary actions to:
   - Process uploaded files
   - Generate proper Nostr events with image metadata
   - Sign and publish the events

## 4. Implement client-side post creation logic

1. Implement file selection and preview functionality
2. Add drag-and-drop support for improved UX
3. Implement file validation (file type, size, etc.)
4. Add client-side image processing (resizing, optimization, etc.)
5. Implement the upload flow using the blossom server

## 5. Create a PostEditor component

1. Design and implement a dedicated `PostEditor` component
2. Support editing post text and attaching images
3. Implement progress indicators during upload
4. Show previews of images before posting

## 6. Implement error handling and progress feedback

1. Add proper error handling for failed uploads
2. Implement progress indicators during uploads
3. Add fallback mechanisms for failed uploads

## Detailed Implementation Steps

### Step 1: Port Utilities to Web App

1. Create the following files:

   - `apps/web/src/utils/blossom-client.ts` - Port from mobile app with browser-compatible code
   - `apps/web/src/utils/uploader.ts` - Web version of the uploader class
   - `apps/web/src/utils/sha256.ts` - Utility to calculate SHA256 hashes of files

2. Update the signature calculation to work with the web app's NDK implementation

### Step 2: Create Post Editor Component

1. Create `apps/web/src/lib/components/PostEditor/index.svelte`
2. Add the following features:
   - File selection button and drag-drop area
   - Image preview thumbnails
   - Text input for captions
   - Upload status indicators
   - Post button

### Step 3: Create Server-Side Handler

1. Create `apps/web/src/routes/(app)/+page.server.ts` with:
   - createPost action that handles form submission
   - Functions to process uploaded files and create proper Nostr events

### Step 4: Update Sidebar to Use New PostEditor

1. Modify `apps/web/src/lib/components/Sidebar.svelte` to use the new PostEditor component

### Step 5: Add Client-Side Image Processing

1. Add utilities for client-side image processing:
   - Resizing images to reasonable dimensions
   - Generating thumbnails
   - Compressing images if needed

### Step 6: Update Post Display Components

1. Ensure `Post/Card.svelte` and other components correctly handle and display the uploaded images

## User Interface Design

The new post editor will:

- Have a clean, modern interface matching the Instagram-like design of the app
- Include a drag-and-drop area for image selection
- Show thumbnails of selected images
- Allow adding captions and tags
- Display upload progress
- Support multiple image uploads in a single post

This implementation will bring the web app's posting capabilities in line with the mobile app, allowing users to easily share images through the platform.
