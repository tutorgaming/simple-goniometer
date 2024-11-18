import React, {useEffect, createRef, useState} from "react";
import Webcam from "react-webcam";
import cv from "@techstark/opencv-js";
import {detectResult, createDetector} from "./arucoDetector.js";
import "./style.css";

window.cv = cv;
let opencv_loaded = false;
let detector = null;

// Goniometer Page
const Goniometer = (props) => {
    // Create Reference to Video Input
    const FPS = 10;
    const videoInput = createRef(null);
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment",
    };

    // Create Reference to Canvas Display
    const inputCanvasDisplay = createRef(null);
    const outputCanvasDisplay = createRef(null);

    // Result as App State
    const [result, setResult] = useState(null);
    const [patientId, setPatientId] = useState(null);
    const [lowestAngle, setLowestAngle] = useState(null);
    const [highestAngle, setHighestAngle] = useState(null);
    const [dataForm, setDataForm] = useState({
        lowestAngle: "",
        highestAngle: "",
        patient: "",
    });
    const getResult = () => {
        if (result) {
            if (result.angle) {
                return result.angle;
            }
            return null;
        }
    };


    useEffect(() => {
        cv["onRuntimeInitialized"] = () => {
            console.log("OpenCV.js is ready");
            detector = createDetector();
            opencv_loaded = true;
            console.log("Detector Created", detector);
        };
    }, []);

    useEffect(() => {
        const processVideo = () => {
            if (!opencv_loaded) {
                setTimeout(processVideo, 0);
                return;
            }
            let begin = Date.now();
            const video = videoInput.current;
            const input_canvas = inputCanvasDisplay.current;
            const output_canvas = outputCanvasDisplay.current;
            if (video && inputCanvasDisplay){
                const input_ctx = input_canvas.getContext("2d");
                input_canvas.width = video.video.videoWidth;
                input_canvas.height = video.video.videoHeight;
                input_ctx.drawImage(video.video, 0, 0, input_canvas.width, input_canvas.height);
                if (input_canvas.width === 0 || input_canvas.height === 0) {
                    setTimeout(processVideo, 0);
                    return;
                };
                let imgData = input_ctx.getImageData(0, 0, input_canvas.width, input_canvas.height);
                let src = cv.matFromImageData(imgData);
                let dst = new cv.Mat(input_canvas.width, input_canvas.height, cv.CV_8UC4);

                let detection_result = detectResult(src, dst, detector);
                setResult(detection_result);
                // console.log("Result", result);
                cv.imshow(output_canvas, dst);
                src.delete();
                dst.delete();
                let delay = 1000/FPS - (Date.now() - begin);
                setTimeout(processVideo, delay);
            }
        };
        setTimeout(processVideo, 0);
    }, [inputCanvasDisplay, outputCanvasDisplay, videoInput, result]);


    // Render HTML
    return (
        <div className="App">
            <h2>Goniometer</h2>
            <Webcam
                audio={false}
                ref={videoInput}
                className="webcam"
                width={1280}
                height={720}
                // mirrored
                screenshotFormat="image/jpeg"
                // forceScreenshotSourceSize={true}
                videoConstraints={videoConstraints}
                // Hide the Webcam input
                style={{
                    width: "0%",
                    height: "0%",
                }}
            />
            {/* Output Canvas Display */}
            <canvas ref={inputCanvasDisplay} id="inputCanvasDisplay" style={{
                    width: "0%",
                    height: "0%",
                }}/>
            <canvas ref={outputCanvasDisplay} id="outputCanvasDisplay"style={{
                    width: "50%",
                    height: "50%",
            }}/>

            {/* Display Current Angle calculated from aruco */}
            <div>
                <h3>Result</h3>
                {/* Display result.angle if available - if null show "No Result" */}
                <p>{result == null? "No Result": result.angle? result.angle:"No Result"}</p>
            </div>
            {/* Create Two Button and Display the angle retrieved */}
            <div>
                <button onClick={() => setLowestAngle(getResult())}>Set Lowest Angle</button>
                Lowest Angle: {lowestAngle}
            </div>
            <div>
                <button onClick={() => setHighestAngle(getResult())}>Set Highest Angle</button>
                Highest Angle: {highestAngle}
            </div>
            <div>
                {/* TextBox to input patient id */}
                <input id="patientName" type="text" placeholder="Patient ID" onChange={(e) => setPatientId(e.target.value)}/>
            </div>
            <div>
                <button onClick={() => {
                    setDataForm({
                        lowestAngle: lowestAngle,
                        highestAngle: highestAngle,
                        patient: patientId,
                    });
                }}>Save Data</button>
                {/* Upload Button */}
                {dataForm.lowestAngle} {dataForm.highestAngle} {dataForm.patient}
                <button onClick={() => {
                    console.log("Data Form", dataForm);
                }}>Upload Data</button>
            </div>
            {/* Clear Data */}
            <div>
                <button onClick={() => {
                    setLowestAngle(null);
                    setHighestAngle(null);
                    setPatientId(null);
                    setDataForm({
                        lowestAngle: "",
                        highestAngle: "",
                        patient: "",
                    })
                    // clear the textbox also
                    document.getElementById("patientName").value = ""
                    ;
                }}>Clear Data</button>
            </div>

        </div>
    );
};

export default Goniometer;