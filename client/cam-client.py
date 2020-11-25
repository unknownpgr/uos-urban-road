import cv2
import requests

SEND_INTERVAL = 100
SEND_INTERVAL_FAIL = 2000

cap = cv2.VideoCapture(0)
while True:
    ret, img = cap.read()
    img = cv2.resize(img, (320, 240))
    is_success, im_buf_arr = cv2.imencode(".jpg", img)
    byte_im = im_buf_arr.tobytes()
    file_dict = {"stream": byte_im}

    try:
        data = requests.post(
            "http://road.urbanscience.uos.ac.kr/api/stream", files=file_dict)
        cv2.waitKey(SEND_INTERVAL)
        print(data.json())
    except Exception:
        print(
            f"Stream transmission failed. Retry after {SEND_INTERVAL_FAIL}ms...")
        cv2.waitKey(SEND_INTERVAL_FAIL)
    except KeyboardInterrupt:
        print('KILL signal detected. Shutdow client.')
        break
