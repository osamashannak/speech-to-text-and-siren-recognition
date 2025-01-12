import React from "react";
import SpeechToText from "./components/SpeechToText";
import SirenDetection from "./components/SirenRecognition.tsx";
import logo from "./assets/logo.jpeg";
import slogan from "./assets/slogan.jpeg";
import schoolLogo from "./assets/school_logo.jpeg";

const App: React.FC = () => {
    return (
        <main>
            <div className={"nav"}>
                <img className={"logo"} src={logo} alt={"Logo"}/>
                <img className={"slogan"} src={slogan} alt={"Logo"}/>
            </div>
            <div className={"main"}>
                <div className={"block"}>
                    <img className={"school-logo"} src={schoolLogo} alt={"School Logo"}/>

                </div>
                <SirenDetection/>
                <SpeechToText/>
            </div>
        </main>
    );
};

export default App;
