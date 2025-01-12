import React, {useRef, useState} from "react";

const SirenRecognition: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState<string>("Waiting for results...");
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const getApiHost = () => {
        const url = new URL(window.location.href);
        const pathSegments = url.pathname.split('/');
        return `${pathSegments[1]}`;
    };

    const startListening = async () => {
        if (!navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support microphone access.");
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new AudioContext();

            const mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorderRef.current = mediaRecorder;

            const audioChunks: Blob[] = [];

            // Handle data when the media recorder has audio chunks
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            // Send audio every 5 seconds
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "audio.wav");

                try {
                    const response = await fetch(`https://${getApiHost()}:5000/siren-detection`, {
                        method: "POST",
                        body: formData,
                    });

                    const data = await response.json();
                    setResult(data.result);
                } catch (error) {
                    console.error("Error sending audio data to backend:", error);
                    setResult("Error processing audio.");
                }

                // Clear chunks after sending
                audioChunks.length = 0;
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
            <h2 style={{marginBottom: "16px"}}>Siren Recognition</h2>
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
