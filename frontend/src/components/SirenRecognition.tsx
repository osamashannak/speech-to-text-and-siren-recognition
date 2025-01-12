import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

const SirenRecognition: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState<string>("Waiting for results...");
    const [classNames, setClassNames] = useState<string[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const yamnetModelRef = useRef<tf.GraphModel | null>(null);

    // Load YAMNet model
    const loadYamnetModel = async () => {
        try {
            const model = await tf.loadGraphModel('/yamnet_model/model.json');
            yamnetModelRef.current = model;
            console.log("YAMNet model loaded successfully.");
        } catch (error) {
            console.error("Error loading YAMNet model:", error);
            alert("Failed to load the YAMNet model.");
        }
    };

    // Load class names from the local CSV file
    const loadClassNames = async () => {
        try {
            const response = await fetch("/yamnet_class_map.csv"); // Assuming the file is in the public folder
            const csvText = await response.text();

            // Parse CSV and extract class names
            const lines = csvText.split("\n").slice(1); // Skip the header
            const names = lines.map((line) => {
                const columns = line.split(",");
                return columns[2]?.trim(); // The third column contains the class name
            });

            setClassNames(names);
            console.log("Class names loaded successfully.");
        } catch (error) {
            console.error("Error loading class names:", error);
            alert("Failed to load class names.");
        }
    };

    useEffect(() => {
        loadYamnetModel();
        loadClassNames();
    }, []);

    const preprocessAudio = async (audioBlob: Blob) => {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get the first channel's audio data
        const audioData = audioBuffer.getChannelData(0);
        const targetSampleRate = 16000;

        // Resample to 16 kHz if needed
        if (audioBuffer.sampleRate !== targetSampleRate) {
            const ratio = targetSampleRate / audioBuffer.sampleRate;
            const newLength = Math.round(audioData.length * ratio);
            const resampled = new Float32Array(newLength);

            for (let i = 0; i < newLength; i++) {
                const originalIndex = i / ratio;
                const lowIndex = Math.floor(originalIndex);
                const highIndex = Math.min(lowIndex + 1, audioData.length - 1);
                const weight = originalIndex - lowIndex;
                resampled[i] = audioData[lowIndex] * (1 - weight) + audioData[highIndex] * weight;
            }
            return resampled;
        }
        return audioData;
    };

    const startListening = async () => {
        if (!navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support microphone access.");
            return;
        }

        if (!yamnetModelRef.current) {
            await loadYamnetModel();
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new AudioContext();

            const mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorderRef.current = mediaRecorder;

            const audioChunks: Blob[] = [];

            // Handle data when the media recorder has audio chunks
            mediaRecorder.ondataavailable = async (event) => {
                audioChunks.push(event.data);

                const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

                // Convert audio to tensor
                const waveform = tf.tensor(await preprocessAudio(audioBlob));

                const model = yamnetModelRef.current;
                if (model) {
                    try {
                        // Predict using YAMNet

                        const [scores] = model.execute({ waveform }) as tf.Tensor[];

                        // Get the class with the highest score
                        const segmentClasses = scores.argMax(1).dataSync(); // Get segment-wise predictions
                        const predictedClasses = Array.from(segmentClasses).map(
                            (idx) => classNames[idx]
                        );
                        console.log(predictedClasses)
                        const isSiren = predictedClasses.some((cls) => cls.toLowerCase().includes("siren"));
                        const result = isSiren ? "Siren detected" : "No siren detected";

                        setResult(`Detected: ${result}`);
                    } catch (error) {
                        console.error("Error during prediction:", error);
                        setResult("Error processing audio.");
                    }
                }

                audioChunks.length = 0; // Clear chunks after processing
            };

            // Start the media recorder and schedule intervals
            mediaRecorder.start();
            intervalRef.current = setInterval(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    mediaRecorder.start();
                }
            }, 2500); // 2.5-second intervals

            setIsListening(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Error accessing microphone. Please try again.");
        }
    };

    const stopListening = () => {
        // Stop the interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Stop the media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        // Stop the audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        setIsListening(false);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2 style={{ marginBottom: "16px" }}>Siren Recognition</h2>
            <button
                onClick={isListening ? stopListening : startListening}
                style={{
                    padding: "0.5rem 1rem",
                    fontSize: "16px",
                    backgroundColor: isListening ? "red" : "green",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                }}
            >
                {isListening ? "Stop Listening" : "Start Listening"}
            </button>
            <p id="result" style={{ fontSize: "24px", color: "red", marginTop: "20px" }}>
                {result}
            </p>
        </div>
    );
};

export default SirenRecognition;
