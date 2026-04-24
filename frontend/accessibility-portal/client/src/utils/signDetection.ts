export async function runSignDetection(video: HTMLVideoElement | null) {
  if (!video) return;
  // Placeholder logic: In a real app you'd load the TFJS model from /public/model
  // and run inference on video frames.
  console.log('Starting sign detection loop (placeholder)...');
  // Simple loop to show frames being read every 500ms
  const loop = async () => {
    if (video.readyState >= 2) {
      // read a frame to canvas or run model
      // This is intentionally minimal for a scaffold
      console.log('video frame available', video.videoWidth, video.videoHeight);
    }
    setTimeout(loop, 500);
  };
  loop();
}
