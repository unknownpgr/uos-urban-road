import React from "react";
import axios from "axios";
import { Alert, Button } from "react-bootstrap";
import "./cadViewer.scss";
import AppContext from "../Context/AppContext";
import { inv } from "mathjs";
import { ClickMenu } from "./ClickMenu";
import { CalibrationInputForm } from "./CalibrationInputForm";
import { DataCell } from "./DataCell";
import {
  isSet,
  createCaliPoint,
  getProjectionMatrix,
  projectH,
  projectV,
  px2cnv,
} from "./calibration";
import { saveFile } from "../../libs/saveFile";
import { mapDict, forDict } from "../../libs/dictUtil";
import {
  loadImage,
  drawBoxedText,
  drawMarker,
  TEXT_ALIGN,
} from "../../libs/imageUtil";

const SENSOR_DATA_COLUMN = {
  date: "Date",
  long: "Longtitude",
  lat: "Latitude",
  alt: "Altitude(m)",
  max_load: "Max Load(kN)",
  max_dist: "Max Distance(mm)",
  e_inv: "E-Inverse",
};

const DATA_STATE = {
  LOADING: 1,
  ERROR: 2,
  OK: 4,
};

function isDataProper(sensorData) {
  return sensorData.e_inv < 0.5;
}

class CadViewer extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);

    // UI event callbacks
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.onMouseRightClick = this.onMouseRightClick.bind(this);
    this.onMenuClick = this.onMenuClick.bind(this);
    this.onInputClosed = this.onInputClosed.bind(this);
    this.onDataExport = this.onDataExport.bind(this);

    // Others
    this.repaint = this.repaint.bind(this);
    this.setter = this.setter.bind(this);
    this.loadSensorData = this.loadSensorData.bind(this);

    this.state = {
      // Calibration data / image data state
      dataState: DATA_STATE.LOADING,

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

    // Mouse position
    this.mouseImgX = 0;
    this.mouseImgY = 0;

    // Section data (from server)
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
        newState.cali[point.idx][key] = value;
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
    let { ctx, cnv, cadImg, mouseImgX: x, mouseImgY: y, scale } = this;
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
      let gpsZ = projectV(
        this.state.cali["Point C"],
        this.state.cali["Point D"],
        y,
        true
      );
      let { cali } = this.state;

      // Draw pivot
      ctx.fillStyle = "#0000ff";
      forDict(this.state.cali, (key, point) => {
        let ix = point.imgX;
        let iy = point.imgY;
        drawMarker(
          ctx,
          ix,
          iy,
          scale * 5,
          "(" + point.gpsX + "," + point.gpsY + ")"
        );
      });

      // Draw sensor data point and get the nearest point to cursor
      let minDist = 99999;
      let minPointIndex = null;
      let isHorizontal = true;
      this.state.sensorData.forEach((row, i) => {
        // Drow on horizontal map
        let [dataX, dataY] = projectH(inv(this.state.M), row.long, row.lat);

        let backgroundColor, foregrondColor;
        if (isDataProper(row)) {
          backgroundColor = "#000";
          foregrondColor = "#fff";
        } else {
          backgroundColor = "#ff0000";
          foregrondColor = "#fff";
        }

        // dataX, dataY = pixel position of data point
        drawMarker(
          ctx,
          dataX,
          dataY,
          scale * 5,
          "#" + (i + 1),
          backgroundColor,
          foregrondColor
        );
        let dist = Math.pow(x - dataX, 2) + Math.pow(y - dataY, 2);
        if (dist < minDist) {
          minDist = dist;
          minPointIndex = i;
          isHorizontal = true;
        }

        // Draw on vertical map
        let dataZ = projectV(cali["Point C"], cali["Point D"], row.alt);
        drawMarker(
          ctx,
          dataX,
          dataZ,
          scale * 5,
          "#" + (i + 1),
          backgroundColor,
          foregrondColor
        );
        dist = Math.pow(x - dataX, 2) + Math.pow(y - dataZ, 2);
        if (dist < minDist) {
          minDist = dist;
          minPointIndex = i;
          isHorizontal = false;
        }
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

        let drawY = isHorizontal ? dataY : dataZ;
        drawMarker(ctx, dataX, drawY, scale * 5, null, "#ff0000");
        drawBoxedText(
          ctx,
          ["Point #" + (minPointIndex + 1)].concat(
            mapDict(
              row,
              (key, value) => SENSOR_DATA_COLUMN[key] + " : " + value
            )
          ),
          dataX,
          drawY,
          TEXT_ALIGN.RIGHT
        );
      } else {
        let text = [];
        if (
          y <
          Math.min(
            this.state.cali["Point C"].imgY,
            this.state.cali["Point D"].imgY
          )
        ) {
          text = [
            `Long:${Math.round(gpsX * 1000) / 1000}`,
            `Lat :${Math.round(gpsY * 1000) / 1000}`,
          ];
        } else {
          text = [`Alt:${Math.round(gpsZ * 1000) / 1000}`];
        }
        // Draw cursor text
        drawBoxedText(ctx, text, x, y, TEXT_ALIGN.LEFT);
      }
    } else {
      ctx.fillStyle = "#800000";
      forDict(this.state.cali, (_, point) => {
        if (!isSet(point)) return;
        let ix = point.imgX;
        let iy = point.imgY;
        drawMarker(ctx, ix, iy, scale * 5);
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
    this.mouseImgX = x;
    this.mouseImgY = y;
    this.scale = scale;
    this.repaint();
  }

  onMenuClick(point) {
    point.imgX = this.mouseImgX;
    point.imgY = this.mouseImgY;
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
    let text = mapDict(SENSOR_DATA_COLUMN, (x) => `"${x}"`).join(",") + "\n";
    text += this.state.sensorData
      .map((row) =>
        mapDict(
          row,
          (key, x) => `"${key === "date" ? new Date(x * 1000) : x}"`
        ).join(",")
      )
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
      this.setState({ dataState: DATA_STATE.OK });

      // Calculate scale and repaint
      this.scale = px2cnv(this.cnv, 0, 0)[2];
      this.loadSensorData(this.state.M);
    } catch (e) {
      this.setState({ dataState: DATA_STATE.ERROR });
      console.error(e);
    }
  }

  render() {
    let alertMsg;
    let alertState;

    // If loading error
    if (this.state.dataState === DATA_STATE.ERROR) {
      alertMsg = "데이터를 로드하던 중 문제가 발생하였습니다.";
      alertState = "danger";
    }

    // If loading
    else if (this.state.dataState === DATA_STATE.LOADING) {
      alertMsg = "데이터를 로드하는 중입니다.";
      alertState = "primary";
    }

    // If loading is ok and some point is not set
    else if (!this.isAllPivotSet()) {
      alertMsg =
        "캘리브레이션 포인트 " +
        mapDict(this.state.cali, (_, value) =>
          !isSet(value) ? value.label : null
        )
          .filter((x) => x)
          .join(", ") +
        "를 설정해주세요.";
      alertState = "warning";
    }

    // If everything is ok
    else {
      alertMsg = null;
      alertState = null;
    }

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
            style={{ opacity: alertMsg ? 0.9 : 0 }}
            variant={alertState}
            className="m-2"
          >
            {alertMsg}
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
                  {mapDict(SENSOR_DATA_COLUMN, (key, value) => (
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
                      backgroundColor: isDataProper(row) ? "none" : "#ffa0a0",
                    }}
                    key={i + "i"}
                  >
                    <DataCell>{i + 1}</DataCell>
                    {mapDict(SENSOR_DATA_COLUMN, (key, _, i) => (
                      <DataCell
                        key={i + "j"}
                        bold={key === "e_inv" && !isDataProper(row)}
                      >
                        {key === "date" ? new Date(row[key] * 1000) : row[key]}
                      </DataCell>
                    ))}
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
