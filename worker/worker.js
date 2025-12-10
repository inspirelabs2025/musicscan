/**
 * MusicScan GIF Render Worker for Fly.io
 * Downloads images, converts to GIF via ffmpeg, uploads to Supabase Storage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Environment variables
const WORKER_API_URL = process.env.WORKER_API_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const POLL_INTERVAL = 5000;
const MAX_WIDTH = 512;
const GIF_FPS = 12;
const BUCKET_NAME = 'renders';

// Validate environment
if (!WORKER_SECRET) {
  console.error('❌ WORKER_SECRET is required');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

console.log('🚀 MusicScan GIF Worker starting...');
console.log(`📡 API URL: ${WORKER_API_URL}`);
console.log(`🗄️ Supabase: ${SUPABASE_URL}`);

// ============================================
// Download Helper
// ============================================
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    const request = protocol.get(url, { 
      headers: { 'User-Agent': 'MusicScan-Worker/1.0' },
      timeout: 30000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Download failed: HTTP ${response.statusCode}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        console.log(`✅ Downloaded: ${stats.size} bytes`);
        resolve(destPath);
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// ============================================
// FFmpeg GIF Conversion
// ============================================
function convertToGif(inputPath, outputPath) {
  console.log(`🎬 Converting to GIF: ${inputPath}`);
  
  // FFmpeg command for high-quality GIF with zoom effect
  // Scale to max 512px width, generate palette, create GIF at 12fps
  const palettePath = inputPath.replace(/\.[^.]+$/, '_palette.png');
  
  try {
    // Step 1: Generate palette for better colors
    const paletteCmd = `ffmpeg -y -i "${inputPath}" -vf "scale='min(${MAX_WIDTH},iw)':-1:flags=lanczos,palettegen=stats_mode=single" "${palettePath}"`;
    console.log(`📊 Generating palette...`);
    execSync(paletteCmd, { stdio: 'pipe' });
    
    // Step 2: Create GIF with palette and zoom effect
    // Simple zoom: scale up slightly over 3 seconds at 12fps (36 frames)
    const gifCmd = `ffmpeg -y -loop 1 -i "${inputPath}" -i "${palettePath}" -filter_complex "[0:v]scale='min(${MAX_WIDTH},iw)':-1:flags=lanczos,zoompan=z='min(zoom+0.002,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${GIF_FPS * 3}:s=${MAX_WIDTH}x${MAX_WIDTH}:fps=${GIF_FPS}[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=5" -t 3 "${outputPath}"`;
    console.log(`🎞️ Creating GIF...`);
    execSync(gifCmd, { stdio: 'pipe' });
    
    // Cleanup palette
    if (fs.existsSync(palettePath)) fs.unlinkSync(palettePath);
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ GIF created: ${stats.size} bytes`);
    
    return outputPath;
  } catch (err) {
    // Cleanup on error
    if (fs.existsSync(palettePath)) fs.unlinkSync(palettePath);
    throw new Error(`FFmpeg error: ${err.message}`);
  }
}

// ============================================
// Supabase Storage Upload
// ============================================
async function uploadToSupabase(filePath, fileName) {
  console.log(`☁️ Uploading to Supabase: ${fileName}`);
  
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `gifs/${fileName}`;
  
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'image/gif',
      'x-upsert': 'true'
    },
    body: fileBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  
  // Return public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
  console.log(`✅ Uploaded: ${publicUrl}`);
  
  return publicUrl;
}

// ============================================
// Worker API Calls
// ============================================
async function pollForJob() {
  try {
    const response = await fetch(`${WORKER_API_URL}/worker-poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WORKER-KEY': WORKER_SECRET
      },
      body: JSON.stringify({ worker_id: 'fly-gif-worker' })
    });
    
    if (!response.ok) {
      console.error(`❌ Poll failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.job || null;
  } catch (err) {
    console.error(`❌ Poll error: ${err.message}`);
    return null;
  }
}

async function updateJobStatus(jobId, status, result, errorMessage) {
  console.log(`📝 Updating job ${jobId}: ${status}`);
  
  try {
    const response = await fetch(`${WORKER_API_URL}/worker-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WORKER-KEY': WORKER_SECRET
      },
      body: JSON.stringify({
        id: jobId,
        status: status,
        result: result,
        error_message: errorMessage
      })
    });
    
    if (!response.ok) {
      console.error(`❌ Update failed: ${response.status}`);
    } else {
      console.log(`✅ Job ${jobId} updated to ${status}`);
    }
  } catch (err) {
    console.error(`❌ Update error: ${err.message}`);
  }
}

// ============================================
// Job Processing
// ============================================
async function processJob(job) {
  console.log(`\n🎯 Processing job: ${job.id}`);
  console.log(`   Type: ${job.type}`);
  console.log(`   Payload: ${JSON.stringify(job.payload).substring(0, 200)}...`);
  
  const workDir = `/tmp/job_${job.id}`;
  
  try {
    // Create work directory
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }
    
    // Extract image URL from payload
    const payload = job.payload || {};
    let imageUrl = null;
    
    // Try different payload structures
    if (payload.images && payload.images[0]) {
      imageUrl = payload.images[0];
    } else if (payload.album_cover_url) {
      imageUrl = payload.album_cover_url;
    } else if (payload.image_url) {
      imageUrl = payload.image_url;
    }
    
    if (!imageUrl) {
      throw new Error('No image URL found in payload');
    }
    
    console.log(`🖼️ Image URL: ${imageUrl}`);
    
    // Download image
    const inputPath = path.join(workDir, 'input.jpg');
    await downloadImage(imageUrl, inputPath);
    
    // Convert to GIF
    const outputPath = path.join(workDir, 'output.gif');
    convertToGif(inputPath, outputPath);
    
    // Upload to Supabase
    const fileName = `${job.id}_${Date.now()}.gif`;
    const publicUrl = await uploadToSupabase(outputPath, fileName);
    
    // Update job as done
    await updateJobStatus(job.id, 'done', {
      success: true,
      url: publicUrl,
      worker: 'fly-gif-worker',
      finished_at: new Date().toISOString()
    }, null);
    
    console.log(`✅ Job ${job.id} completed successfully`);
    
  } catch (err) {
    console.error(`❌ Job ${job.id} failed: ${err.message}`);
    
    // Update job as error
    await updateJobStatus(job.id, 'error', {
      success: false,
      worker: 'fly-gif-worker',
      finished_at: new Date().toISOString()
    }, err.message);
    
  } finally {
    // Cleanup work directory
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}

// ============================================
// Main Loop
// ============================================
async function mainLoop() {
  console.log('🔄 Starting main polling loop...\n');
  
  while (true) {
    try {
      const job = await pollForJob();
      
      if (job) {
        await processJob(job);
      } else {
        // No job, wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (err) {
      console.error(`❌ Loop error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

// Start the worker
mainLoop();
