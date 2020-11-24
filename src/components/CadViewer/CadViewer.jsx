import React from "react";
import axios from "axios";
import { Alert, Button } from "react-bootstrap";
import "./cadViewer.scss";
import AppContext from "../Context/AppContext";
import { add, inv, multiply, subtract, transpose } from "mathjs";
import { ClickMenu } from "./ClickMenu";
import { CalibrationInputForm } from "./CalibrationInputForm";
import { DataCell } from "./DataCell";
import { isSet, createCaliPoint } from "./calibration";
import { saveFile } from "../../libs/saveFile";
import { mapDict, forDict } from "../../libs/dictUtil";

const sensorDataColumn = {
  date: "Date",
  long: "Longtitude",
  lat: "Latitude",
  alt: "Altitude(m)",
  max_load: "Max Load(kN)",
  max_dist: "Max Distance(mm)",
  e_inv: "E-Inverse",
};

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function px2cnv(cnv, x, y) {
  // Convert mouse position to canvas pixel position.
  let rect = cnv.getBoundingClientRect();
  let scaleX = cnv.width / rect.width;
  let scaleY = cnv.height / rect.height;
  let x_ = (x - rect.left) * scaleX;
  let y_ = (y - rect.top) * scaleY;
  return [x_, y_, scaleX, scaleY];
}

function getProjectionMatrix(pointA, pointB, flip = true) {
  try {
    const ROTATATION = [
      [0, 1, 0],
      [-1, 0, 0],
      [0, 0, 1],
    ];

    let img1 = [pointA.imgX, pointA.imgY, 1];
    let img2 = [pointB.imgX, pointB.imgY, 1];
    let img3 = add(img1, multiply(ROTATATION, subtract(img2, img1)));

    let gps1 = [pointA.gpsX, pointA.gpsY, 1];
    let gps2 = [pointB.gpsX, pointB.gpsY, 1];
    let gps3;
    if (!flip) {
      gps3 = add(gps1, multiply(ROTATATION, subtract(gps2, gps1)));
    } else {
      gps3 = add(gps1, multiply(transpose(ROTATATION), subtract(gps2, gps1)));
    }

    let img = transpose([img1, img2, img3]);
    let gps = transpose([gps1, gps2, gps3]);

    let ii = inv(img);
    let M = multiply(gps, ii);
    return M;
  } catch {
    return [[0, 0, 0], [0, 0, 0][(0, 0, 0)]];
  }
}

// Horizontal projection
function projectH(M, x, y) {
  try {
    let [x_, y_] = multiply(M, [[x], [y], [1]]);
    return [x_[0], y_[0]];
  } catch {
    return [0, 0];
  }
}

// Vertical projection
function projectV(pA, pB, y) {
  return pA.imgY + ((y - pA.gpsY) * (pB.imgY - pA.imgY)) / (pB.gpsY - pA.gpsY);
}

function drawBoxedText(
  ctx,
  lines,
  x,
  y,
  margin = 0.5,
  left = false,
  back = "#000",
  fore = "#fff"
) {
  // Calculate text width, height
  let width = 0;
  let height = 0;
  lines.forEach((line) => {
    let size = ctx.measureText(line);
    width = Math.max(width, size.width);
    height = Math.max(height, size.actualBoundingBoxAscent);
  });
  margin *= height;

  // Draw box
  ctx.fillStyle = back;
  ctx.fillRect(
    x,
    y,
    width + margin * 2,
    (height + margin) * lines.length + margin
  );

  // Draw text
  ctx.fillStyle = fore;
  lines.forEach((line, i) => {
    ctx.fillText(line, x + margin, y + (margin + height) * (i + 1));
  });
}

function drawAnchor(ctx, x, y, size = 5, label = null) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y - size * 1.73);
  ctx.lineTo(x - size, y - size * 1.73);
  ctx.fill();

  if (label) {
    let width = ctx.measureText(label).width;
    ctx.fillText(label, x - width / 2, y - size * 2.5);
  }
}

class CadViewer extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    // Function binding
    this.repaint = this.repaint.bind(this);
    this.setter = this.setter.bind(this);
    this.loadSensorData = this.loadSensorData.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.onMouseRightClick = this.onMouseRightClick.bind(this);
    this.onMenuClick = this.onMenuClick.bind(this);
    this.onInputClosed = this.onInputClosed.bind(this);
    this.onDataExport = this.onDataExport.bind(this);

    this.state = {
      // Alerts
      alertCadMsg: "CAD 데이터 로딩 중...",
      alertCadState: "primary",
      alertCaliMsg: "",

      // Menu
      isMenuVisible: false,
      menuX: 0,
      menuY: 0,

      // Input
      isInputVisible: false,

      // Calibration
      cali: {
        "Point A": createCaliPoint("Point A", "A"),
        "Point B": createCaliPoint("Point B", "B"),
        "Point C": createCaliPoint("Point C", "C", false),
        "Point D": createCaliPoint("Point D", "D", false),
      },
      M: [
        [0, 0],
        [0, 0],
      ],
      selectedPoint: null,

      // Data
      sensorData: [],
    };

    // Array of calibration points
    this.imgX = 0;
    this.imgY = 0;
    this.section = null;
  }

  isAllPivotSet() {
    let result = true;
    forDict(this.state.cali, (_, point) => {
      result &= isSet(point);
    });
    return result;
  }

  setter(point) {
    return (key) => (value) => {
      this.setState((state) => {
        let newState = { ...state };

        // Update point value
        newState.cali[point.idx][key] = value;

        // Update message
        if (this.isAllPivotSet()) newState.alertCaliMsg = null;
        else {
          let alertMsg =
            "캘리브레이션 포인트 " +
            mapDict(this.state.cali, (_, value) =>
              !isSet(value) ? value.label : null
            )
              .filter((x) => x)
              .join(", ") +
            "를 설정해주세요.";
          newState.alertCaliMsg = alertMsg;
        }

        return newState;
      });
    };
  }

  loadSensorData(M) {
    // Get data points
    if (!this.isAllPivotSet()) return;

    let { width } = this.section;
    let [xs, ys] = projectH(M, 0, 0);
    let [xe, ye] = projectH(
      M,
      width,
      Math.min(this.state.cali["Point C"].imgY, this.state.cali["Point D"].imgY)
    );
    axios
      .get("/api/data", {
        params: {
          xs,
          ys,
          xe,
          ye,
        },
      })
      .then((x) => x.data)
      .then((sensorData) => {
        this.setState({ sensorData });
      });
  }

  repaint() {
    let { ctx, cnv, cadImg, imgX: x, imgY: y, scale } = this;
    // (x,y) = pixel position of mouse cursor

    if (ctx == null || cadImg == null) return;

    // Draw CAD image
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.drawImage(cadImg, 0, 0);

    // Draw cursor(+ shape)
    this.ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x, y + 32);
    ctx.moveTo(x - 32, y);
    ctx.lineTo(x + 32, y);
    ctx.stroke();
    this.ctx.lineWidth = 1;

    // Adjust font size
    ctx.font = Math.round(scale * 15) + "px Ariel";

    // Draw mouse position text
    if (this.isAllPivotSet()) {
      let [gpsX, gpsY] = projectH(this.state.M, x, y);
      let { cali } = this.state;

      // Draw sensor data point and get the nearest point to cursor
      ctx.fillStyle = "#000000";
      let minDist = 99999;
      let minPointIndex = null;
      let isHorizontal = true;
      this.state.sensorData.forEach((row, i) => {
        // Drow on horizontal map
        let [dataX, dataY] = projectH(inv(this.state.M), row.long, row.lat);
        // dataX, dataY = pixel position of data point
        drawAnchor(ctx, dataX, dataY, scale * 5, "#" + (i + 1));
        let dist = Math.pow(x - dataX, 2) + Math.pow(y - dataY, 2);
        if (dist < minDist) {
          minDist = dist;
          minPointIndex = i;
          isHorizontal = true;
        }

        // Draw on vertical map
        let dataZ = projectV(cali["Point C"], cali["Point D"], row.alt);
        drawAnchor(ctx, dataX, dataZ, scale * 5, "#" + (i + 1));
        dist = Math.pow(x - dataX, 2) + Math.pow(y - dataZ, 2);
        if (dist < minDist) {
          minDist = dist;
          minPointIndex = i;
          isHorizontal = false;
        }
      });

      // Draw pivot
      ctx.fillStyle = "#0000ff";
      forDict(this.state.cali, (key, point) => {
        let ix = point.imgX;
        let iy = point.imgY;
        drawAnchor(
          ctx,
          ix,
          iy,
          scale * 5,
          "(" + point.gpsX + "," + point.gpsY + ")"
        );
      });

      // If nearest point in in 5px, highlight it.
      if (minDist < Math.pow(scale * 10, 2)) {
        let row = this.state.sensorData[minPointIndex];
        let [dataX, dataY] = projectH(inv(this.state.M), row.long, row.lat);
        let dataZ = projectV(cali["Point C"], cali["Point D"], row.alt);

        ctx.beginPath();
        ctx.moveTo(dataX, dataY);
        ctx.lineTo(dataX, dataZ);
        ctx.stroke();

        ctx.fillStyle = "#ff0000";
        let drawY = isHorizontal ? dataY : dataZ;
        drawAnchor(ctx, dataX, drawY, scale * 5);
        drawBoxedText(
          ctx,
          [
            "Point #" + (minPointIndex + 1),
            "Long : " + row.long,
            "Lat : " + row.lat,
            "Alt : " + row.alt,
          ],
          dataX,
          drawY
        );
      } else {
        // Draw cursor text
        drawBoxedText(
          ctx,
          [
            `X:${Math.round(gpsX * 1000) / 1000}`,
            `Y:${Math.round(gpsY * 1000) / 1000}`,
          ],
          x,
          y
        );
      }
    } else {
      ctx.fillStyle = "#800000";
      forDict(this.state.cali, (_, point) => {
        if (!isSet(point)) return;
        let ix = point.imgX;
        let iy = point.imgY;
        drawAnchor(ctx, ix, iy, scale * 5);
        drawBoxedText(
          ctx,
          [point.label + " (" + point.gpsX + "," + point.gpsY + ")"],
          ix - 10,
          iy + 10,
          0.1
        );
      });
    }
  }

  onMouseLeftClick(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.setState({ isMenuVisible: false });
  }

  onMouseRightClick(event) {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;

    this.setState({
      isMenuVisible: !this.state.isMenuVisible,
      menuX: x,
      menuY: y,
    });
  }

  onMouseMove(event) {
    if (!(this.ctx && this.cnv && this.cadImg) || this.state.isMenuVisible)
      return;

    // Get mouse position in pixel
    let [x, y, scale] = px2cnv(this.cnv, event.clientX, event.clientY);
    this.imgX = x;
    this.imgY = y;
    this.scale = scale;
    this.repaint();
  }

  onMenuClick(point) {
    point.imgX = this.imgX;
    point.imgY = this.imgY;
    this.setState({
      selectedPoint: point,
      isInputVisible: true,
      isMenuVisible: false,
    });
  }

  onInputClosed() {
    let M = getProjectionMatrix(
      this.state.cali["Point A"],
      this.state.cali["Point B"]
    );
    this.setState({ isInputVisible: false, M });
    axios.post("/api/cali", { data: this.state.cali, ...this.section });
    this.loadSensorData(M);
  }

  onDataExport() {
    let text = mapDict(sensorDataColumn, (x) => `"${x}"`).join(",") + "\n";
    text += this.state.sensorData
      .map((row) => mapDict(row, (key, x) => `"${x}"`).join(","))
      .join("\n");
    saveFile(`sensor_data_${new Date()}.csv`, text);
  }

  async componentDidMount() {
    try {
      // Get metadata
      this.section = this.props.data;
      let { width, height, cad_file, station, section } = this.props.data;

      // Set canvas
      this.cnv.width = width;
      this.cnv.height = height;
      this.ctx = this.cnv.getContext("2d");

      // Load image
      let loadProc = loadImage("/img/cad/" + cad_file).then((img) => {
        this.cadImg = img;
      });

      // Get calibration data
      let dataProc = axios
        .get(
          `/api/cali?station=${station}&section=${encodeURIComponent(section)}`
        )
        .then((x) => x.data)
        .then((result) => {
          // Update calibration points
          result.data.forEach((point) => {
            let setPoint = this.setter(point, false);
            forDict(point, (key, value) => {
              setPoint(key)(value);
            });
          });

          // Then, calculate projection matrix
          this.setState({
            M: getProjectionMatrix(
              this.state.cali["Point A"],
              this.state.cali["Point B"]
            ),
          });
        });

      // Wati until all resources loaded
      await Promise.all([loadProc, dataProc]);
      this.setState({ alertCadMsg: null });

      // Calculate scale and repaint
      this.scale = px2cnv(this.cnv, 0, 0)[2];
      this.loadSensorData(this.state.M);
    } catch (e) {
      this.setState({
        alertState: "danger",
        alertMsg: "데이터를 로드하던 중 에러가 발생했습니다.",
      });
      console.error(e);
    }
  }

  render() {
    this.repaint();
    return (
      <div className="cadViewer">
        <h1 className="m-4 text-center">현장 CAD</h1>
        <ClickMenu
          show={this.state.isMenuVisible}
          x={this.state.menuX}
          y={this.state.menuY}
          points={this.state.cali}
          onClick={this.onMenuClick}
        ></ClickMenu>
        <CalibrationInputForm
          show={this.state.isInputVisible}
          point={this.state.selectedPoint}
          setter={this.setter(this.state.selectedPoint)}
          onSave={this.onInputClosed}
        ></CalibrationInputForm>
        <div className="alertGroup">
          <Alert
            style={{ opacity: this.state.alertCadMsg ? 0.9 : 0 }}
            variant={this.state.alertCadState}
            className="m-2"
          >
            {this.state.alertCadMsg}
          </Alert>
          <Alert
            style={{ opacity: this.state.alertCaliMsg ? 0.9 : 0 }}
            variant={"warning"}
            className="m-2"
          >
            {this.state.alertCaliMsg}
          </Alert>
        </div>
        <hr></hr>
        <canvas
          ref={(cnv) => {
            this.cnv = cnv;
          }}
          className="w-100"
          onMouseMove={this.onMouseMove}
          onClick={this.onMouseLeftClick}
          onContextMenu={this.onMouseRightClick}
        ></canvas>
        <hr></hr>
        <div
          style={{ display: this.state.sensorData.length > 0 ? "" : "none" }}
        >
          <h1 className="m-4 text-center">센서 데이터</h1>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {mapDict(sensorDataColumn, (key, value) => (
                    <th scope="col" key={key}>
                      {value}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {this.state.sensorData.map((row, i) => (
                  <tr
                    style={{
                      backgroundColor: row.e_inv < 0.5 ? "#ffa0a0" : "none",
                    }}
                    key={i + "i"}
                  >
                    <DataCell>{i + 1}</DataCell>
                    {mapDict(sensorDataColumn, (key, value, i) =>
                      key === "date" ? (
                        <DataCell key={i + "j"}>
                          {new Date(row[key] * 1000)}
                        </DataCell>
                      ) : (
                        <DataCell
                          key={i + "j"}
                          bold={key === "e_inv" && row.e_inv < 0.5}
                        >
                          {row[key]}
                        </DataCell>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={this.onDataExport}>Export data</Button>
        </div>
      </div>
    );
  }
}

export default CadViewer;
