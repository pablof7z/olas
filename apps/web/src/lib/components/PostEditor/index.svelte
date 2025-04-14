<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { createImageThumbnail, isFileSizeValid, isImageFile, optimizeImage } from '../../../utils/file';
    import { createUploader } from '../../../utils/uploader';
    import { getBlossomServer } from '../../../utils/blossom';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Textarea } from '$lib/components/ui/textarea/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { X, Image, Upload, Loader2 } from 'lucide-svelte';
    import { ndkStore } from '$lib/stores/ndk.svelte';
    import { getCurrentUser } from '$lib/stores/currentUser.svelte';
    import { NDKEvent } from '@nostr-dev-kit/ndk';

    // Define types for our component state
    type FileItem = {
        file: File;
        thumbnail: string;
    };
    
    type UploadProgress = Record<string, number>;

    // Event dispatcher for custom events
    const dispatch = createEventDispatcher();

    // Use state variables with runes
    let fileItems = $state<FileItem[]>([]);
    let content = $state('');
    let uploadProgress = $state<UploadProgress>({});
    let uploading = $state(false);
    let dragActive = $state(false);
    let error = $state('');
    
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILES = 10;
    const blossomServer = getBlossomServer();
    
    // Get current user and NDK instance
    const currentUser = $derived(getCurrentUser());
    
    let fileInput: HTMLInputElement;
    
    // Debug logging
    $effect(() => {
        console.log('fileItems updated:', fileItems.length);
    });
    
    onMount(() => {
        if (!currentUser) {
            error = 'You need to be logged in to post.';
        }
    });
    
    async function handleFileSelect(event: Event) {
        console.log('handleFileSelect called', event);
        const input = event.target as HTMLInputElement;
        console.log('Files selected:', input.files);
        if (!input.files?.length) return;
        
        await addFiles(Array.from(input.files));
        input.value = ''; // Reset input to allow selecting the same file again
    }
    
    async function addFiles(newFiles: File[]) {
        console.log('addFiles called with', newFiles.length, 'files');
        error = '';
        
        if (fileItems.length + newFiles.length > MAX_FILES) {
            error = `You can only upload up to ${MAX_FILES} images.`;
            return;
        }
        
        for (const file of newFiles) {
            // Validate file
            if (!isImageFile(file)) {
                error = 'Only image files are allowed.';
                console.error('File validation failed: Not an image file', file);
                continue;
            }
            
            if (!isFileSizeValid(file, MAX_FILE_SIZE_MB)) {
                error = `File size must be less than ${MAX_FILE_SIZE_MB}MB.`;
                console.error('File validation failed: File too large', file);
                continue;
            }
            
            try {
                console.log('Generating thumbnail for:', file.name);
                const thumbnail = await createImageThumbnail(file);
                console.log('Thumbnail generated successfully');
                
                // Add a new file item
                fileItems = [...fileItems, { file, thumbnail }];
                console.log('Added file, total items:', fileItems.length);
            } catch (e) {
                console.error('Failed to create thumbnail:', e);
            }
        }
    }
    
    function removeFile(index: number) {
        fileItems = fileItems.filter((_, i) => i !== index);
        
        // Also remove from progress if it exists
        const fileId = `file-${index}`;
        if (uploadProgress[fileId]) {
            const newProgress = { ...uploadProgress };
            delete newProgress[fileId];
            uploadProgress = newProgress;
        }
        
        console.log('After removal - files length:', fileItems.length);
    }
    
    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragActive = false;
        
        if (!event.dataTransfer?.files?.length) return;
        
        await addFiles(Array.from(event.dataTransfer.files));
    }
    
    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        dragActive = true;
    }
    
    function handleDragLeave() {
        dragActive = false;
    }
    
    async function uploadFile(fileItem: FileItem, index: number): Promise<string | null> {
        try {
            // Optimize the image before uploading
            const optimizedFile = await optimizeImage(fileItem.file);
            const fileId = `file-${index}`;
            
            // Create uploader
            const uploader = await createUploader(ndkStore, new File([optimizedFile], fileItem.file.name, { type: 'image/jpeg' }), blossomServer);
            
            // Set up progress tracking
            uploader.onProgress = (progress) => {
                uploadProgress = { ...uploadProgress, [fileId]: progress };
            };
            
            // Handle errors
            uploader.onError = (err) => {
                console.error('Upload error:', err);
                error = `Failed to upload ${fileItem.file.name}: ${err.message}`;
                return null;
            };
            
            // Start upload
            await uploader.start();
            
            // Create media event
            const mediaEvent = uploader.mediaEvent();
            await mediaEvent.publish();
            
            // Return the URL from the image tag
            const urlTag = mediaEvent.tags.find((tag: string[]) => tag[0] === 'url');
            return urlTag ? urlTag[1] : null;
        } catch (e) {
            console.error('Upload error:', e);
            error = `Failed to upload ${fileItem.file.name}`;
            return null;
        }
    }
    
    async function handleSubmit() {
        if (!currentUser) {
            error = 'You need to be logged in to post.';
            return;
        }
        
        if (fileItems.length === 0 && !content.trim()) {
            error = 'Please add an image or write a caption.';
            return;
        }
        
        uploading = true;
        error = '';
        
        try {
            const imageUrls: string[] = [];
            
            // Upload all files
            for (let i = 0; i < fileItems.length; i++) {
                const url = await uploadFile(fileItems[i], i);
                if (url) imageUrls.push(url);
            }
            
            // Create and publish the post event
            const event = new NDKEvent(ndkStore);
            event.kind = 1; // Regular note
            event.content = content;
            
            // Add image URLs as tags
            imageUrls.forEach(url => {
                event.tags.push(['r', url]);
            });
            
            await event.publish();
            
            // Reset form
            fileItems = [];
            content = '';
            uploadProgress = {};
            
            // Dispatch a completed event so parent components can handle it
            dispatch('completed', { success: true });
        } catch (e) {
            console.error('Post creation failed:', e);
            error = 'Failed to create post. Please try again.';
        } finally {
            uploading = false;
        }
    }

    function triggerFileInput() {
        console.log('Triggering file input click');
        if (fileInput) {
            fileInput.click();
        }
    }
</script>

<div class="post-editor">
    <!-- Caption/text input -->
    <Textarea 
        bind:value={content} 
        placeholder="Write a caption..." 
        class="w-full mb-4 min-h-24" 
        disabled={uploading}
    />

    <!-- File selection area -->
    <div 
        class="file-drop-area border-2 border-dashed rounded-md p-6 mb-4 text-center flex flex-col items-center justify-center transition-colors {dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}" 
        on:drop={handleDrop} 
        on:dragover={handleDragOver} 
        on:dragleave={handleDragLeave}
    >
        {#if fileItems.length === 0}
            <div class="mb-4">
                <Image class="w-16 h-16 mx-auto opacity-50" />
                <p class="mt-2">Drag photos here</p>
            </div>
            <input 
                bind:this={fileInput}
                type="file" 
                accept="image/*" 
                multiple 
                class="hidden" 
                on:change={handleFileSelect} 
                disabled={uploading}
            />
            <Button
                variant="outline"
                class="bg-blue-500 text-white hover:bg-blue-600"
                disabled={uploading}
                on:click={triggerFileInput}
            >
                Select from computer
            </Button>
        {:else}
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {#each fileItems as item, i}
                    <div class="relative group">
                        <img 
                            src={item.thumbnail || 'placeholder.jpg'} 
                            alt="Thumbnail" 
                            class="w-full h-32 object-cover rounded-md"
                        />
                        <button 
                            type="button"
                            class="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            on:click={() => removeFile(i)}
                            disabled={uploading}
                        >
                            <X class="w-4 h-4" />
                        </button>
                        {#if uploadProgress[`file-${i}`] !== undefined && uploadProgress[`file-${i}`] < 100}
                            <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div class="text-white font-bold">
                                    {uploadProgress[`file-${i}`]}%
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
                {#if fileItems.length < MAX_FILES}
                    <div 
                        class="cursor-pointer flex items-center justify-center h-32 border-2 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                        on:click={triggerFileInput}
                    >
                        <span class="flex flex-col items-center text-gray-500">
                            <Upload class="w-8 h-8 mb-2" />
                            Add more
                        </span>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if error}
        <div class="text-red-500 mb-4">
            {error}
        </div>
    {/if}

    <div class="flex justify-end">
        <Button 
            type="button" 
            class="bg-blue-500 text-white hover:bg-blue-600" 
            on:click={handleSubmit} 
            disabled={uploading || (fileItems.length === 0 && !content.trim()) || !currentUser}
        >
            {#if uploading}
                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                Posting...
            {:else}
                Post
            {/if}
        </Button>
    </div>
</div>

<style>
    .post-editor {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
    }
</style> 