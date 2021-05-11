import serial.tools.list_ports
import serial
import time

'''
GNSS String sample

$GNGGA,071805.00,3734.97502894,N,12703.49222527,E,1,08,2.6,54.9900,M,0.0000,M,,*73
gps_type, gps_time, gps_lat, _, gps_long, _, gps_fix, gps_num, gps_precision, gps_height, _, gps_diff, _, _,
'''

BAUD_RATE = 9600


def parse_pos(pos_string, int_part):
    '''
    Convert NMEA GPGGA Gps position data into degree
    '''
    degree = int(pos_string[:int_part])
    minute = float(pos_string[int_part:])
    return degree+minute/60


# GPS 데이터가 아니라 다른 시리얼(e.g. LWD)에 연결돼있어서 사용하면 안 되는 포트들의 목록
banned_ports = []

with open("gps-client.log", "a") as log:
    while True:
        try:
            # Detect available ports
            while True:

                ports = serial.tools.list_ports.comports()
                ports = list(map(lambda x: x[0], ports))
                ports = list(filter(lambda x: x not in banned_ports, ports))

                if len(ports) > 0:
                    port_gps = ports[0]
                    serial_port = serial.Serial(
                        port=port_gps, baudrate=BAUD_RATE)
                    break
                else:
                    print("No available COM port detected.")
                    print("Banned ports :", banned_ports)
                    time.sleep(5)

            # Read GPS signal
            while True:
                gps_string = serial_port\
                    .readline()\
                    .decode('ASCII')\
                    .replace("\n", "")\
                    .replace("\r", '')\
                    .strip()

                # Skip empty string
                if len(gps_string) == 0:
                    continue

                # Skip wrong ports
                if not gps_string.startswith('$G'):
                    banned_ports.append(port_gps)
                    break

                gps_params = gps_string.split(',')
                gps_type = gps_params[0]
                gps_lat = parse_pos(gps_params[2], 2)
                gps_long = parse_pos(gps_params[4], 3)
                gps_alt = float(gps_params[9])
                print(gps_lat, gps_long, gps_alt, sep=',', flush=True)
                log.write(f"DATA{gps_lat},{gps_long},{gps_alt}\n")
                log.flush()

        except Exception as e:
            print(f"Exception occurred : {e}")
            print("Retry GPS connection")
            time.sleep(1)
