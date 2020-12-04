import cv2
import requests
import numpy as np
import time
import sys

SEND_INTERVAL_FAIL = 2  # unit : second
IMG_WIDTH = 320
IMG_HEIGHT = 240
CAMERA_INDEXES = [1, 2, 3, 4]
SERVER_URL = "http://road.urbanscience.uos.ac.kr/api/stream"

# Redirect stderr to log file to remove warning message
sys.stderr = open('.\err.log', 'w')

# Pre-allocate arrays
img_concat = np.zeros((IMG_HEIGHT*len(CAMERA_INDEXES), IMG_WIDTH, 3))
img_empty = np.zeros((IMG_HEIGHT, IMG_WIDTH, 3))

while True:
    try:
        # Read camera and make concatenated image
        for i in range(len(CAMERA_INDEXES)):
            cap = cv2.VideoCapture(CAMERA_INDEXES[i])
            ret, img = cap.read()
            if ret:
                img = cv2.resize(img, (IMG_WIDTH, IMG_HEIGHT))
                img_concat[IMG_HEIGHT*i: IMG_HEIGHT*(i+1), :] = img
            else:
                img_concat[IMG_HEIGHT*i: IMG_HEIGHT*(i+1), :] = img_empty
            cap.release()

        # Encode image into byte array
        is_success, im_buf_arr = cv2.imencode(".jpg", img_concat)
        byte_im = im_buf_arr.tobytes()
        file_dict = {"stream": byte_im}

        # Send image to server
        data = requests.post(SERVER_URL, files=file_dict)
        if data.status_code == 200:
            print(data.text, flush=True)

    except Exception as e:
        # If image transmission failed, try after SEND_INTERVAL_FAIL ms.
        print(
            f"Stream transmission failed. Retry after {SEND_INTERVAL_FAIL}s...")
        time.sleep(SEND_INTERVAL_FAIL)
        print('Reason : ', e)

    except KeyboardInterrupt:
        # If CTRL+C pressed, break the loop
        print('Shutdow client')
        break
