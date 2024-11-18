// OpenCV.js Lib
import cv from "@techstark/opencv-js";
import "./style.css";

const createDetector = () => {
    let detectionParams = new cv.aruco_DetectorParameters();
    let refineParams = new cv.aruco_RefineParameters(10, 3, true);
    let dictionary = cv.getPredefinedDictionary(cv.DICT_6X6_250);
    let detector = new cv.aruco_ArucoDetector(dictionary, detectionParams, refineParams);

    return detector;
}

const detectResult = (img, detector) => {
    // console.log("Img", img.size());
    const width = img.size().width;
    const height = img.size().height;

    let dst = new cv.Mat(width, height, cv.CV_8UC4);
    let gray = new cv.Mat();


    // DrawDetectedMarkers on 3CH
    cv.cvtColor(img, dst, cv.COLOR_RGBA2RGB, 0);
    cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);

    let corners_matvec = new cv.MatVector()
    let id_mat = new cv.Mat()
    detector.detectMarkers(gray, corners_matvec, id_mat);

    if (id_mat.rows > 0) {
        // Draw detected markers
        cv.drawDetectedMarkers(dst, corners_matvec, id_mat);

        // Sort the markers by id_mat
        let ids = id_mat.data32S;
        let corners = [];
        for (let i = 0; i < corners_matvec.size(); i++) {
            let markerCorners = corners_matvec.get(i).data32F;
            corners.push({
                id: ids[i],
                corners: markerCorners
            });
        }
        corners.sort((a, b) => a.id - b.id);

        // Extract centers and check alignment
        let centers = [];
        for (let i = 0; i < corners.length; i++) {
            let markerCorners = corners[i].corners;
            let centerX = (markerCorners[0] + markerCorners[2] + markerCorners[4] + markerCorners[6]) / 4;
            let centerY = (markerCorners[1] + markerCorners[3] + markerCorners[5] + markerCorners[7]) / 4;
            centers.push([centerX, centerY]);
        }
        // Draw Lines if 3 markers detected
        if (centers.length >= 3) {
            let angle = calculate2DAngle(centers);
            console.log("----", angle , "Degs ----");

            let id0_center = centers[0];
            let id1_center = centers[1];
            let id2_center = centers[2];
            // Draw Line from Center 0->1 1->2
            cv.line(dst, new cv.Point(id0_center[0], id0_center[1]), new cv.Point(id1_center[0], id1_center[1]), new cv.Scalar(0, 0, 255, 255), 3);
            cv.line(dst, new cv.Point(id1_center[0], id1_center[1]), new cv.Point(id2_center[0], id2_center[1]), new cv.Scalar(0, 255, 0, 255), 3);
            return {
                "marker0": centers[0],
                "marker1": centers[1],
                "marker2": centers[2],
                "angle": angle,
                "image": dst
            };
        }
    }

    // Release memory
    corners_matvec.delete();
    id_mat.delete();
    dst.delete();
    gray.delete();

    return {
        "marker0": null,
        "marker1": null,
        "marker2": null,
        "angle": null,
        "image": dst
    };
};


function calculate2DAngle(centers) {
    let id0_center = centers[0];
    let id1_center = centers[1];
    let id2_center = centers[2];

    // Vectors
    let v1 = {
        x: id0_center[0] - id1_center[0],
        y: id0_center[1] - id1_center[1]
    };
    let v2 = {
        x: id2_center[0] - id1_center[0],
        y: id2_center[1] - id1_center[1]
    };

    // Dot product
    let dotProduct = v1.x * v2.x + v1.y * v2.y;

    // Magnitudes
    let magnitudeV1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    let magnitudeV2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    // Angle in radians
    let angleRadians = Math.acos(dotProduct / (magnitudeV1 * magnitudeV2));

    // Convert to degrees (optional)
    let angleDegrees = angleRadians * (180 / Math.PI);

    return angleDegrees;
}


// Export detectResult
export { detectResult, createDetector };