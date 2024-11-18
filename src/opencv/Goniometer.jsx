import React, {useEffect, createRef} from "react";
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
    const imgRef = createRef(null);
    const inputCanvasDisplay = createRef(null);
    const outputCanvasDisplay = createRef(null);

    let result = {
        "marker0" : null,
        "marker1" : null,
        "marker2" : null,
        "angle" : null
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
            if (video.video && inputCanvasDisplay){
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
                let dst = new cv.Mat();
                let gray = new cv.Mat();
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
                cv.cvtColor(gray, dst, cv.COLOR_GRAY2RGBA, 0);

                output_canvas.width = dst.size().width;
                output_canvas.height = dst.size().height;
                cv.imshow(output_canvas, dst);

                src.delete();
                dst.delete();
                gray.delete();
                let delay = 1000/FPS - (Date.now() - begin);
                setTimeout(processVideo, delay);
            }
        };
        setTimeout(processVideo, 0);
    }, [inputCanvasDisplay, outputCanvasDisplay, videoInput]);




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
            {/* Output Image */}
            <img className="inputImage" ref={imgRef} alt="" />
            {/* Output Canvas Display */}
            <canvas ref={inputCanvasDisplay} id="inputCanvasDisplay" style={{
                    width: "0%",
                    height: "0%",
                }}/>
            <canvas ref={outputCanvasDisplay} id="outputCanvasDisplay"/>

            {/* Display Current Angle calculated from aruco */}



        </div>
    );
};

export default Goniometer;