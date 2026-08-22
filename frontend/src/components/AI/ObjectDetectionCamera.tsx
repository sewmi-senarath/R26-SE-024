import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as Speech from 'expo-speech';

// Initialize TFJS
const initTF = async () => {
  await tf.ready();
  // Fallback to CPU if WebGL fails in Expo Go
  try {
    await tf.setBackend('rn-webgl');
  } catch (e) {
    await tf.setBackend('cpu');
  }
};
initTF();

const TensorCamera = cameraWithTensors(CameraView);

const { width, height } = Dimensions.get('window');

interface ObjectDetectionCameraProps {
  onObjectDetected: (name: string, score: number) => void;
  targetObject: string | null;
}

export default function ObjectDetectionCamera({ onObjectDetected, targetObject }: ObjectDetectionCameraProps) {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const lastDetectedRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      setIsModelReady(true);
    })();
  }, []);

  const handleCameraStream = (images: any, updatePreview: any, gl: any) => {
    const loop = async () => {
      if (!model) return;

      const imageTensor = images.next().value;
      if (!imageTensor) return;

      const predictions = await model.detect(imageTensor);
      
      predictions.forEach((prediction) => {
        if (prediction.score > 0.65) {
          onObjectDetected(prediction.class, prediction.score);
          
          if (targetObject && prediction.class.toLowerCase() === targetObject.toLowerCase()) {
            if (lastDetectedRef.current !== prediction.class) {
               Speech.speak(`${prediction.class} detected with ${Math.round(prediction.score * 100)}% accuracy.`);
               lastDetectedRef.current = prediction.class;
            }
          }
        }
      });

      tf.dispose([imageTensor]);
      
      requestAnimationFrame(loop);
    };

    loop();
  };

  if (!isModelReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Initializing EchoCare AI Engine...</Text>
      </View>
    );
  }

  return (
    <TensorCamera
      style={styles.camera}
      facing="back"
      onReady={handleCameraStream}
      autorender={true}
      resizeHeight={224}
      resizeWidth={224}
      resizeDepth={3}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
