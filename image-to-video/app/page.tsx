'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(3);
  const [effect, setEffect] = useState('zoom-in');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image || !canvasRef.current) return;

    setIsProcessing(true);
    setVideoUrl(null);

    setTimeout(async () => {
      try {
        const videoBlob = await createVideoFromCanvas(image, duration, effect);
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
      } catch (error) {
        console.error('Error generating video:', error);
        alert('Failed to generate video. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const createVideoFromCanvas = async (
    imageDataUrl: string,
    duration: number,
    effect: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.onload = async () => {
        canvas.width = 1280;
        canvas.height = 720;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));

        mediaRecorder.start();

        const fps = 30;
        const totalFrames = duration * fps;
        let frame = 0;

        const drawFrame = () => {
          if (frame >= totalFrames) {
            mediaRecorder.stop();
            return;
          }

          const progress = frame / totalFrames;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          applyEffect(ctx, img, effect, progress, canvas.width, canvas.height);

          frame++;
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      img.onerror = reject;
      img.src = imageDataUrl;
    });
  };

  const applyEffect = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    effect: string,
    progress: number,
    width: number,
    height: number
  ) => {
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    let drawWidth = width;
    let drawHeight = height;

    if (imgAspect > canvasAspect) {
      drawHeight = width / imgAspect;
    } else {
      drawWidth = height * imgAspect;
    }

    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.save();

    switch (effect) {
      case 'zoom-in':
        const scaleIn = 1 + progress * 0.5;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleIn, scaleIn);
        ctx.translate(-width / 2, -height / 2);
        break;

      case 'zoom-out':
        const scaleOut = 1.5 - progress * 0.5;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleOut, scaleOut);
        ctx.translate(-width / 2, -height / 2);
        break;

      case 'pan-left':
        const scalePanLeft = 1.2;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scalePanLeft, scalePanLeft);
        ctx.translate(-width / 2, -height / 2);
        ctx.translate(-progress * width * 0.2, 0);
        break;

      case 'pan-right':
        const scalePanRight = 1.2;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scalePanRight, scalePanRight);
        ctx.translate(-width / 2, -height / 2);
        ctx.translate(progress * width * 0.2, 0);
        break;

      case 'pan-up':
        const scalePanUp = 1.2;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scalePanUp, scalePanUp);
        ctx.translate(-width / 2, -height / 2);
        ctx.translate(0, -progress * height * 0.2);
        break;

      case 'pan-down':
        const scalePanDown = 1.2;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scalePanDown, scalePanDown);
        ctx.translate(-width / 2, -height / 2);
        ctx.translate(0, progress * height * 0.2);
        break;

      case 'rotate':
        ctx.translate(width / 2, height / 2);
        ctx.rotate(progress * Math.PI * 2);
        ctx.translate(-width / 2, -height / 2);
        break;

      case 'fade':
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        ctx.globalAlpha = Math.max(0.1, alpha);
        break;
    }

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          Image to Video
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Transform your images into stunning animated videos
        </p>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-purple-500 transition-colors"
            >
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-xl text-gray-600 mb-2">
                Click to upload an image
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={image}
                  alt="Uploaded"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <button
                  onClick={() => {
                    setImage(null);
                    setVideoUrl(null);
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Animation Effect
                  </label>
                  <select
                    value={effect}
                    onChange={(e) => setEffect(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="zoom-in">Zoom In</option>
                    <option value="zoom-out">Zoom Out</option>
                    <option value="pan-left">Pan Left</option>
                    <option value="pan-right">Pan Right</option>
                    <option value="pan-up">Pan Up</option>
                    <option value="pan-down">Pan Down</option>
                    <option value="rotate">Rotate</option>
                    <option value="fade">Fade In/Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration: {duration} seconds
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <button
                  onClick={generateVideo}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating Video...
                    </span>
                  ) : (
                    'Generate Video'
                  )}
                </button>
              </div>

              {videoUrl && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Your Video is Ready!
                  </h2>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg shadow-lg"
                  />
                  <a
                    href={videoUrl}
                    download="generated-video.mp4"
                    className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-green-700 transition-colors"
                  >
                    Download Video
                  </a>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
