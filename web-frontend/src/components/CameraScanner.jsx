import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { X, Camera, RefreshCw } from 'lucide-react';

const CameraScanner = ({ onDetected, targetObject, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFound, setIsFound] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const net = await cocoSsd.load();
      setModel(net);
      setLoading(false);
      startCamera();
    };
    loadModel();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Uses back camera on mobile
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  useEffect(() => {
    if (model && videoRef.current) {
      const detect = async () => {
        if (videoRef.current.readyState === 4) {
          const predictions = await model.detect(videoRef.current);
          drawBoundingBoxes(predictions);
          
          // Check if target object is found
          if (targetObject) {
            const found = predictions.find(p => 
              p.class.toLowerCase().includes(targetObject.toLowerCase()) && p.score > 0.6
            );
            if (found && !isFound) {
              setIsFound(true);
              onDetected(found);
            }
          }
        }
        requestAnimationFrame(detect);
      };
      detect();
    }
  }, [model, targetObject, isFound]);

  const drawBoundingBoxes = (predictions) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const isTarget = targetObject && prediction.class.toLowerCase().includes(targetObject.toLowerCase());
      
      ctx.strokeStyle = isTarget ? '#10b981' : '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = isTarget ? '#10b981' : '#3b82f6';
      ctx.font = '18px Arial';
      ctx.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        x, y > 20 ? y - 10 : y + 20
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full max-w-2xl bg-slate-900 overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedMetadata={() => {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20 flex flex-col justify-between p-8">
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Scanning For</p>
                 <h3 className="text-xl font-black text-white">{targetObject || 'Any Object'}</h3>
              </div>
              <button 
                onClick={onClose}
                className="bg-white/10 hover:bg-rose-500 backdrop-blur-md p-3 rounded-xl text-white transition-all pointer-events-auto"
              >
                <X size={24} />
              </button>
           </div>

           {loading && (
             <div className="flex flex-col items-center gap-4">
               <RefreshCw className="text-blue-500 animate-spin" size={48} />
               <p className="text-white font-bold tracking-widest uppercase text-xs">Initializing AI Vision...</p>
             </div>
           )}

           {isFound && (
             <div className="bg-emerald-500 text-white p-6 rounded-3xl text-center shadow-2xl shadow-emerald-500/40 animate-bounce pointer-events-auto">
                <h4 className="text-2xl font-black mb-1">FOUND IT!</h4>
                <p className="font-bold opacity-90">Here is your {targetObject}</p>
             </div>
           )}
           
           {!isFound && !loading && (
             <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest">Scanning surroundings...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
