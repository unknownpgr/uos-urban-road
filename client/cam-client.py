import cv2
import requests
import numpy as np
import sys

SEND_INTERVAL = 100  # ms
SEND_INTERVAL_FAIL = 2000  # ms
IMG_WIDTH = 320
IMG_HEIGHT = 240
CAMERA_INDEXES = [1, 2, 3, 4]
SERVER_URL = "https://api.road.urbanscience.uos.ac.kr/stream"

if(len(sys.argv) > 1):
    CAMERA_INDEXES = list(map(lambda x: int(x), sys.argv[1:]))
    if len(CAMERA_INDEXES) > 4:
        CAMERA_INDEXES = CAMERA_INDEXES[:4]

print('Used camera :', CAMERA_INDEXES)

# Create available camera dictinary
cameras = {}
for i in range(len(CAMERA_INDEXES)):
    index = CAMERA_INDEXES[i]
    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    ret, img = cap.read()
    if ret:
        cameras[i] = cap
        height, width, _ = img.shape

        # Compare ratio to prevent distortion
        if width*IMG_HEIGHT != IMG_WIDTH*height:
            print(
                f"Camera ratio and image ratio are different for camera {index}. cam={width/height},img={IMG_WIDTH/IMG_HEIGHT}")
            exit(1)
        print("Got camera", index)
    else:
        print("Could not get camera", index)
        cap.release()

# Pre-allocate arrays
img_concat = np.zeros((IMG_HEIGHT*4, IMG_WIDTH, 3))
img_empty = np.zeros((IMG_HEIGHT, IMG_WIDTH, 3))

while True:
    try:

        # Read camera and make concatenated image
        for i in cameras:
            cap = cameras[i]
            ret, img = cap.read()
            if ret:
                img = cv2.resize(img, (IMG_WIDTH, IMG_HEIGHT))
                img_concat[IMG_HEIGHT*i: IMG_HEIGHT*(i+1), :] = img
            else:
                img_concat[IMG_HEIGHT*i: IMG_HEIGHT*(i+1), :] = img_empty

        # Encode image into byte array
        is_success, im_buf_arr = cv2.imencode(".jpg", img_concat)
        byte_im = im_buf_arr.tobytes()
        file_dict = {"stream": byte_im}

        # Send image to server
        data = requests.post(SERVER_URL, files=file_dict)
        cv2.waitKey(SEND_INTERVAL)
        if data.status_code == 200:
            print(data.text, flush=True)

    except Exception:
        # If image transmission failed, try after SEND_INTERVAL_FAIL ms.
        print(
            f"Stream transmission failed. Retry after {SEND_INTERVAL_FAIL}ms...")
        cv2.waitKey(SEND_INTERVAL_FAIL)

    except KeyboardInterrupt:
        # If CTRL+C pressed, break the loop
        print('Shutdow client')
        break

# Release all resources
for i in cameras:
    cameras[i].release()
