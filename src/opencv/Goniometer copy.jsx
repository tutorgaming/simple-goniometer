import React, {useEffect, createRef} from "react";
import Webcam from "react-webcam";
import cv from "@techstark/opencv-js";
import {detectResult, createDetector} from "./arucoDetector.js";
import "./style.css";

window.cv = cv;
let opencv_loaded = false;
let detector = null;

// Goniometer Page
const Goniometer = ({}) => {
    // Create Reference to Video Input
    const videoInput = createRef(null);
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment",
    };

    // Create Reference to Canvas Display
    const imgRef = createRef(null);
    const outputCanvasDisplay = createRef(null);

    let result = {
        "marker0" : null,
        "marker1" : null,
        "marker2" : null,
        "angle" : null
    };

    // useEffect(() => {
    //     cv["onRuntimeInitialized"] = () => {
    //         console.log("OpenCV.js is ready");
    //         detector = createDetector();
    //         opencv_loaded = true;
    //         console.log("Detector Created", detector);
    //     };
    // }, []);


    // Consume Frame from Webcam
    const consumeFrame = async () => {
        // if (!opencv_loaded) return;
        const imageSrc = videoInput.current.getScreenshot({
            width: 1280,
            height: 720,
        });
        if (!imageSrc) return;

        const processImage = (resolve) => {
            imgRef.current.src = imageSrc;
            imgRef.current.onload = () => {
                try {
                    // Convert Webcam Image to OpenCV Image
                    const img = cv.imread(imgRef.current);

                    // Process Image Here
                    // if (detector){
                    //     result = detectResult(img, detector);
                    // }
                    // Show Result on img tag
                    cv.imshow(outputCanvasDisplay.current, img);

                    // Release Memory
                    img.delete();
                    resolve();
                } catch (error) {
                    console.log(error);
                    resolve();
                }
            }
        };

        return new Promise(processImage);
    };

    // Render Routine
    useEffect(() => {
        let handle;
        const nextTick = () => {
            handle = requestAnimationFrame(async () => {
                await consumeFrame();
                nextTick();
            });
        };
        nextTick();
        return () => {
            cancelAnimationFrame(handle);
        };

    }, []);

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
            <img className="inputImage" ref={imgRef} />
            {/* Output Canvas Display */}
            <canvas ref={outputCanvasDisplay} />
            {/* Display Current Angle calculated from aruco */}



        </div>
    );
};

export default Goniometer;