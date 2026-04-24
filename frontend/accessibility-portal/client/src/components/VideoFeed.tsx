import React, { useRef, useEffect } from 'react';
import { runSignDetection } from '../utils/signDetection';

export default function VideoFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Start detection loop (placeholder)
      runSignDetection(videoRef.current as HTMLVideoElement);
    }
    start().catch(console.error);
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="bg-white rounded shadow p-2">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded" />
    </div>
  );
}
