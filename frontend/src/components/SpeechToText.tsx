import React, { useState, useEffect, useRef } from "react";

const SpeechToText: React.FC = () => {
    const [transcription, setTranscription] = useState<string>("");
    const [listening, setListening] = useState<boolean>(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [language, setLanguage] = useState<string>("ar-SA");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = language;
        recognitionInstance.interimResults = true;
        recognitionInstance.continuous = true;

        recognitionInstance.addEventListener('result', onSpeak);
        setRecognition(recognitionInstance);

        return () => {
            recognitionInstance.removeEventListener('result', onSpeak);
            recognitionInstance.stop();
        };
    }, [language]);

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

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value);
    };

    return (
        <div className="block">
            <h2>💬 Speech-to-Text</h2>
            <p className={"description"}>Read what's spoken to you.</p>
            <span className={"language"}>Select language:</span>
            <select onChange={handleLanguageChange} value={language}>
                <option value="ar-SA">Arabic</option>
                <option value="en-US">English</option>
            </select>
            <button className={"button"} onClick={toggleListening}>
                {listening ? "Stop Listening" : "Start Listening"}
            </button>
            <div>
                <textarea readOnly dir={"auto"} className="transcription-text" value={transcription}/>
            </div>
        </div>
    );
};

export default SpeechToText;