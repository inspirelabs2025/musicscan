import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WORKER_ID = process.env.WORKER_ID || `worker-${Date.now()}`;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');

// Validate config
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log(`🚀 MusicScan Render Worker starting...`);
console.log(`   Worker ID: ${WORKER_ID}`);
console.log(`   Poll interval: ${POLL_INTERVAL_MS}ms`);

/**
 * Download image from URL to temp file
 */
async function downloadImage(url) {
  const tempDir = os.tmpdir();
  const filename = `input-${Date.now()}.jpg`;
  const filepath = path.join(tempDir, filename);
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = require('fs').createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath).catch(() => {});
      reject(err);
    });
  });
}

/**
 * Render video with ffmpeg
 * Creates a 9:16 vertical video with zoom effect and album art overlay
 */
async function renderVideo(imagePath, artist, title) {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `output-${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    // Video settings
    const width = 1080;
    const height = 1920;
    const duration = 6;
    const fps = 30;
    
    // Build filter complex for zoom effect with album overlay
    const filterComplex = [
      // Scale and blur background
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=20:5[bg]`,
      // Scale album art for center overlay
      `[0:v]scale=400:400[album]`,
      // Zoom effect on background (1.0 to 1.3 over duration)
      `[bg]zoompan=z='1+0.05*on/${fps}/${duration}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${fps*duration}:s=${width}x${height}:fps=${fps}[zoomed]`,
      // Overlay album art in center
      `[zoomed][album]overlay=(W-w)/2:(H-h)/2[v]`
    ].join(';');
    
    ffmpeg(imagePath)
      .inputOptions(['-loop 1'])
      .outputOptions([
        `-t ${duration}`,
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,zoompan=z='1+0.05*on/${fps}/${duration}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${fps*duration}:s=${width}x${height}:fps=${fps}`
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`   [FFMPEG] ${cmd}`);
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

/**
 * Upload video to Supabase Storage
 */
async function uploadToStorage(videoPath, jobId) {
  const videoBuffer = await fs.readFile(videoPath);
  const filename = `videos/${jobId}.mp4`;
  
  const { data, error } = await supabase.storage
    .from('tiktok-videos')
    .upload(filename, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('tiktok-videos')
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
}

/**
 * Process a single job
 */
async function processJob(job) {
  console.log(`[CLAIM] Job ${job.job_id}: ${job.artist} - ${job.title}`);
  
  let imagePath = null;
  let videoPath = null;
  
  try {
    // Download image
    console.log(`   [DOWNLOAD] ${job.image_url}`);
    imagePath = await downloadImage(job.image_url);
    
    // Render video
    console.log(`   [RENDER] Creating video...`);
    videoPath = await renderVideo(imagePath, job.artist, job.title);
    
    // Upload to storage
    console.log(`   [UPLOAD] Uploading to Supabase Storage...`);
    const outputUrl = await uploadToStorage(videoPath, job.job_id);
    
    // Mark job as completed
    const { error } = await supabase.rpc('complete_render_job', {
      p_job_id: job.job_id,
      p_output_url: outputUrl
    });
    
    if (error) throw error;
    
    console.log(`   [DONE] ✅ ${outputUrl}`);
    
  } catch (err) {
    console.error(`   [ERROR] ❌ ${err.message}`);
    
    // Mark job as failed
    await supabase.rpc('fail_render_job', {
      p_job_id: job.job_id,
      p_error_message: err.message
    });
    
  } finally {
    // Cleanup temp files
    if (imagePath) await fs.unlink(imagePath).catch(() => {});
    if (videoPath) await fs.unlink(videoPath).catch(() => {});
  }
}

/**
 * Poll for jobs
 */
async function pollForJobs() {
  try {
    // Claim a job atomically
    const { data: jobs, error } = await supabase.rpc('claim_render_job', {
      p_worker_id: WORKER_ID
    });
    
    if (error) {
      console.error(`[POLL] Error: ${error.message}`);
      return;
    }
    
    if (!jobs || jobs.length === 0) {
      // No jobs available
      return;
    }
    
    // Process the claimed job
    await processJob(jobs[0]);
    
  } catch (err) {
    console.error(`[POLL] Unexpected error: ${err.message}`);
  }
}

/**
 * Main loop
 */
async function main() {
  console.log(`✅ Worker ready, polling every ${POLL_INTERVAL_MS}ms`);
  
  // Initial poll
  await pollForJobs();
  
  // Set up interval
  setInterval(pollForJobs, POLL_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  process.exit(0);
});

// Start worker
main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
