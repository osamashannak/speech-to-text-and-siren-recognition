import React from "react";
import SpeechToText from "./components/SpeechToText";
import SirenDetection from "./components/SirenRecognition.tsx";

const App: React.FC = () => {
    return (
        <div>
            <div className={"nav"}>
                <h1 className={"title"}>Speech-to-Text and Siren Recognition</h1>
            </div>
            <main>
                <div>
                    <SirenDetection />
                    <SpeechToText/>
                </div>
            </main>
        </div>
    );
};

export default App;
