import React, { useState, useEffect, useRef } from "react";

const SpeechToText: React.FC = () => {
    const [transcription, setTranscription] = useState<string>("");
    const [listening, setListening] = useState<boolean>(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = "ar-SA"; // Set the desired language
        recognitionInstance.interimResults = true;
        recognitionInstance.continuous = true;

        recognitionInstance.addEventListener('result', onSpeak);
        setRecognition(recognitionInstance);

        return () => {
            recognitionInstance.removeEventListener('result', onSpeak);
            recognitionInstance.stop();
        };
    }, []);

    function onSpeak(event: SpeechRecognitionEvent) {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        console.log("Transcript:", transcript);
        setTranscription(transcript);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setTranscription("");
        }, 5000); // Reset transcription after 5 seconds of silence
    }

    const toggleListening = () => {
        if (listening) {
            recognition!.onend = null;
            recognition!.stop();
            setTranscription("");
        } else {
            recognition!.onend = () => {
                if (listening) {
                    console.log('Speech recognition has stopped. Starting again ...');
                    recognition!.start();
                }
            };
            recognition!.start();
        }
        setListening(!listening);
    };

    return (
        <div className="speech-to-text">
            <h2>Speech-to-Text</h2>
            <button onClick={toggleListening}>
                {listening ? "Stop Listening" : "Start Listening"}
            </button>
            <div className="transcription-box">
                <p className="transcription-text">{transcription}</p>
            </div>
        </div>
    );
};

export default SpeechToText;