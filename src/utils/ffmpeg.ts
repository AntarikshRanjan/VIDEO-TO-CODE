import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

async function fetchAsBlob(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw error;
  }
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  
  // Try multiple CDN URLs and loading methods
  const loadConfigs = [
    // Method 1: Using toBlobURL with unpkg
    {
      name: 'unpkg v0.12.10 (toBlobURL)',
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
      useToBlobURL: true,
    },
    // Method 2: Using direct fetch with unpkg
    {
      name: 'unpkg v0.12.10 (direct fetch)',
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
      useToBlobURL: false,
    },
    // Method 3: Using jsdelivr
    {
      name: 'jsdelivr v0.12.10',
      coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
      useToBlobURL: true,
    },
    // Method 4: Fallback to v0.12.6
    {
      name: 'unpkg v0.12.6',
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      useToBlobURL: true,
    },
    // Method 5: Try without /dist/esm path
    {
      name: 'unpkg v0.12.10 (root)',
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/ffmpeg-core.wasm',
      useToBlobURL: true,
    },
  ];
  
  let lastError: Error | null = null;

  for (const config of loadConfigs) {
    try {
      console.log(`Attempting to load FFmpeg using: ${config.name}...`);
      
      let coreURL: string;
      let wasmURL: string;

      if (config.useToBlobURL) {
        coreURL = await toBlobURL(config.coreURL, 'text/javascript');
        wasmURL = await toBlobURL(config.wasmURL, 'application/wasm');
      } else {
        coreURL = await fetchAsBlob(config.coreURL);
        wasmURL = await fetchAsBlob(config.wasmURL);
      }
      
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      ffmpegInstance = ffmpeg;
      console.log(`FFmpeg loaded successfully using: ${config.name}`);
      return ffmpeg;
    } catch (error: any) {
      console.warn(`Failed to load using ${config.name}:`, error.message || error);
      lastError = error;
      // Try next method
      continue;
    }
  }

  // If all methods fail, throw detailed error
  console.error('Failed to load FFmpeg from all sources:', lastError);
  const errorDetails = lastError?.message || lastError?.toString() || 'Unknown error';
  
  throw new Error(
    `Failed to initialize FFmpeg after trying ${loadConfigs.length} different methods.\n\n` +
    `Possible causes:\n` +
    `- Network connectivity issues (check your internet)\n` +
    `- CORS restrictions in browser\n` +
    `- CDN unavailable or blocked\n` +
    `- Browser doesn't support WebAssembly\n\n` +
    `Last error: ${errorDetails}\n\n` +
    `Troubleshooting:\n` +
    `1. Check browser console for detailed errors\n` +
    `2. Verify internet connection\n` +
    `3. Try a different browser (Chrome, Firefox, Edge)\n` +
    `4. Check if WebAssembly is enabled in browser\n` +
    `5. Disable browser extensions that might block CDN requests`
  );
}

/**
 * Extract frames using Canvas API (fallback method)
 * This works without FFmpeg but has limitations
 */
async function extractFramesWithCanvas(
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    const frames: string[] = [];
    const frameInterval = 2; // Extract 1 frame every 2 seconds
    let currentTime = 0;

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const totalFrames = Math.ceil(duration / frameInterval);
      
      onProgress?.(0);

      const extractFrame = () => {
        if (currentTime >= duration) {
          URL.revokeObjectURL(videoUrl);
          resolve(frames);
          return;
        }

        // Set canvas size to match video (or max 800px width)
        const maxWidth = 800;
        const aspectRatio = video.videoWidth / video.videoHeight;
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = canvas.width / aspectRatio;

        // Seek to the desired time
        video.currentTime = currentTime;
      };

      // Handle seek completion
      video.addEventListener('seeked', () => {
        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const base64 = canvas.toDataURL('image/png');
        frames.push(base64);

        const progress = (frames.length / totalFrames) * 100;
        onProgress?.(progress);

        // Move to next frame
        currentTime += frameInterval;
        extractFrame();
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error(`Video error: ${e.message || 'Unknown error'}`));
      });

      // Start extraction
      extractFrame();
    });
  });
}

/**
 * Extract frames using FFmpeg (primary method)
 */
async function extractFramesWithFFmpeg(
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const ffmpeg = await loadFFmpeg();
  const frames: string[] = [];

  // Write video file to FFmpeg
  const videoData = await fetchFile(videoFile);
  await ffmpeg.writeFile('input.mp4', videoData);

  // Get video duration
  const duration = await getVideoDuration(ffmpeg);
  const frameInterval = 2; // Extract 1 frame every 2 seconds
  const totalFrames = Math.ceil(duration / frameInterval);

  onProgress?.(0);

  // Extract frames
  for (let i = 0; i < totalFrames; i++) {
    const timestamp = i * frameInterval;
    
    try {
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-vf', 'scale=800:-1',
        `frame_${i}.png`,
      ]);

      const frameData = await ffmpeg.readFile(`frame_${i}.png`);
      const blob = new Blob([frameData], { type: 'image/png' });
      const base64 = await blobToBase64(blob);
      frames.push(base64);

      // Clean up
      await ffmpeg.deleteFile(`frame_${i}.png`);

      const progress = ((i + 1) / totalFrames) * 100;
      onProgress?.(progress);
    } catch (error) {
      console.warn(`Failed to extract frame at ${timestamp}s:`, error);
    }
  }

  // Clean up input file
  await ffmpeg.deleteFile('input.mp4');

  return frames;
}

/**
 * Extract frames from video - tries FFmpeg first, falls back to Canvas API
 */
export async function extractFrames(
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  try {
    // Try FFmpeg first (better quality, more reliable)
    console.log('Attempting to extract frames using FFmpeg...');
    return await extractFramesWithFFmpeg(videoFile, onProgress);
  } catch (error: any) {
    console.warn('FFmpeg extraction failed, falling back to Canvas API:', error);
    
    // Fallback to Canvas API if FFmpeg fails
    try {
      console.log('Using Canvas API for frame extraction (fallback method)...');
      return await extractFramesWithCanvas(videoFile, onProgress);
    } catch (canvasError: any) {
      console.error('Both FFmpeg and Canvas extraction failed:', canvasError);
      throw new Error(
        `Failed to extract frames using both methods.\n\n` +
        `FFmpeg error: ${error.message || 'Unknown'}\n` +
        `Canvas error: ${canvasError.message || 'Unknown'}\n\n` +
        `Please ensure your video file is valid and try again.`
      );
    }
  }
}

async function getVideoDuration(ffmpeg: FFmpeg): Promise<number> {
  try {
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-f', 'null',
      '-',
    ]);
  } catch (error: any) {
    // FFmpeg outputs duration in stderr
    const output = error?.message || '';
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  // Fallback: assume 10 seconds if we can't determine
  return 10;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

