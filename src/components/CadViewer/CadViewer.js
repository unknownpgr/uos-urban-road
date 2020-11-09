import React from "react";
import axios from "axios";
import { Alert, ButtonGroup, Button, Modal, Form } from "react-bootstrap";
import "./cadViewer.scss";
import AppContext from "../Context/AppContext";

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function px2cnv(cnv, x, y) {
  // Convert mouse position to canvas pixel.
  let rect = cnv.getBoundingClientRect();
  let scaleX = cnv.width / rect.width;
  let scaleY = cnv.height / rect.height;
  let x_ = (x - rect.left) * scaleX;
  let y_ = (y - rect.top) * scaleY;
  return [x_, y_, scaleX, scaleY];
}

function ClickMenu(props) {
  return (
    <ButtonGroup
      vertical
      className="clickMenu"
      style={{
        display: props.show ? undefined : "none",
        left: props.x,
        top: props.y,
      }}>
      {props.points?.map((point, i) => (
        <Button
          onClick={() => props.onClick(point)}
          key={i}
          variant={point.isSet() ? "success" : "primary"}>
          {point.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function LabeledInput(props) {
  let { label, value, setValue } = props;
  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        onChange={e => setValue(e.target.value)}
        value={value()}
        type='number'
      ></Form.Control>
    </Form.Group>
  );
}

function CalibrationInputForm(props) {
  let point = props.point;
  return (
    <Modal show={props.show} >
      <Modal.Header>
        <Modal.Title>캘리브레이션 {point?.label} 세팅</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {point?.useX ?
            <LabeledInput
              label='X'
              value={point?.getGetter('gpsX')}
              setValue={point?.getSetter('gpsX')}
            >
            </LabeledInput> : undefined}
          <LabeledInput
            label='Y'
            value={point?.getGetter('gpsY')}
            setValue={point?.getSetter('gpsY')}
          >
          </LabeledInput>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={props.onSave}>
          저장
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DataCell(props) {
  // Return properly formatted data wrapped with <td>
  let item = props.children;
  let str;
  if (typeof item == 'number') {
    if (Number.isInteger(item)) {
      // If integer, just convert to string.
      str = item.toString();
    } else {
      // If float, round to four decimal place.
      str = (item.toString() + '0000').substr(0, 6);
    }
  } else if (item instanceof Date) {
    // If date, convert to local date string
    str = item.toLocaleDateString();
  } else {
    // Else, just convert to string.
    str = item.toString();
  }
  return <td>{str}</td>;
}

class CadCalibration {
  constructor(component, idx, label, useX = true) {
    this.idx = idx;
    this.label = label;
    this.component = component;
    this.useX = useX;

    // Actually, this code is bad, because it directly modifies state of component, without calling setState.
    if (!(component.state.calibration)) component.state.calibration = {};
    component.state.calibration[idx] = {
      idx,
      label,
      imgX: 0,
      imgY: 0,
      gpsX: 0,
      gpsY: 0,
    };
  }

  get(propertyName) {
    return this.component.state.calibration[this.idx][propertyName];
  }

  set(propertyName, newValue) {
    let { calibration } = this.component.state;     // Get state
    calibration[this.idx][propertyName] = newValue; // Update state
    this.component.setState({ calibration });       // Set updated state with re-rendering
  }

  getGetter(propertyName) {
    return () => this.get(propertyName);
  }

  getSetter(propertyName) {
    return (newValue) => this.set(propertyName, newValue);
  }

  isSet() {
    if (this.useX) { return this.get('gpsX') * this.get('gpsY') > 0; }
    else { return this.get('gpsY') > 0; }
  }
}

class CadViewer extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.repaint = this.repaint.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.onMouseRightClick = this.onMouseRightClick.bind(this);
    this.onMenuClicked = this.onMenuClicked.bind(this);
    this.onInputClosed = this.onInputClosed.bind(this);

    // The difference between state and component variable is that
    // state change always makes re-render.
    // It works similar to 'ref'.
    this.state = {
      alertShow: true,
      alertStr: "CAD 데이터 로딩 중...",
      alertState: "primary",
      isMenuVisible: false,
      isInputVisible: false,
      menuX: 0,
      menuY: 0,
    };

    // Array of calibration points
    this.imgX = 0;
    this.imgY = 0;
    this.points = [
      new CadCalibration(this, 'Point A', 'Calibration point A'),
      new CadCalibration(this, 'Point B', 'Calibration point B'),
      new CadCalibration(this, 'Point C', 'Calibration point C', false),
      new CadCalibration(this, 'Point D', 'Calibration point D', false),
    ];
  }

  repaint() {
    let { ctx, imgX: x, imgY: y, scale } = this;

    // Draw CAD image
    ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
    ctx.drawImage(this.cadImg, 0, 0);

    // Draw cursor(+ shape)
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x, y + 32);
    ctx.moveTo(x - 32, y);
    ctx.lineTo(x + 32, y);
    ctx.stroke();

    // Draw mouse position text
    let fontSize = Math.round(scale * 15);
    ctx.font = fontSize + "px Ariel";
    ctx.fillText(`X:${Math.round(x)}`, x + fontSize, y + fontSize * 1.5);
    ctx.fillText(`Y:${Math.round(y)}`, x + fontSize, y + fontSize * 3);

    // Draw pivot
    ctx.fillStyle = '#0000ff';
    this.points.forEach(point => {
      if (!point.isSet()) return;
      let ix = point.get("imgX");
      let iy = point.get("imgY");
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + 5, iy - 10);
      ctx.lineTo(ix - 5, iy - 10);
      ctx.fill();
      ctx.fillText("(" + point.get("gpsX") + "," + point.get("gpsY") + ")", ix - 10, iy - 20);
    });
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
    if (!(this.ctx && this.cnv && this.cadImg) || this.state.isMenuVisible) return;

    // Get mouse position in pixel
    let [x, y, scale] = px2cnv(this.cnv, event.clientX, event.clientY);
    this.imgX = x;
    this.imgY = y;
    this.scale = scale;
    this.repaint();
  }

  onMenuClicked(point) {
    point.set('imgX', this.imgX);
    point.set('imgY', this.imgY);
    this.setState({
      selectedPoint: point,
      isInputVisible: true,
      isMenuVisible: false,
    });
  }

  onInputClosed() {
    this.setState({ isInputVisible: false });
    axios.post('/api/cali', { data: this.state.calibration, img: this.meta.img });
  }

  componentDidMount() {
    try {
      // Get metadata
      let meta = this.props.data;
      this.meta = meta;

      // Set canvas
      this.cnv.width = meta.w;
      this.cnv.height = meta.h;
      this.ctx = this.cnv.getContext("2d");
      this.ctx.lineWidth = 3;

      // Load image
      let loadProc = loadImage("/img/cad/" + meta.img).then(img => {
        this.cadImg = img;
        this.setState({ alertShow: false });
      });

      // Get calibration data
      let dataProc = axios.get('/api/cali?img=' + meta.img)
        .then(x => x.data)
        .then((result) => {
          result.data.forEach(point => {
            Object.keys(point).forEach(key => {
              this.state.calibration[point.idx][key] = point[key];
            });
          });
        });

      Promise.all([loadProc, dataProc])
        .then(() => {
          // Calculate scale and repaint
          this.scale = px2cnv(this.cnv, 0, 0)[2];
          this.repaint();
        });
    } catch (e) {
      this.setState({ alertShow: true, alertState: 'danger', alertStr: '데이터를 로드하던 중 에러가 발생했습니다.' });
      console.error(e);
    }
  }

  render() {
    const dummy = [
      [1, new Date('11/09/2020'), 0.02071, 0.21387, 0.50817, 0.47047, 0.53267],
      [2, new Date('11/10/2020'), 0.66872, 0.92397, 0.11227, 0.56167, 0.42237],
      [3, new Date('11/11/2020'), 0.68123, 0.82402, 0.18402, 0.18092, 0.90762],
      [4, new Date('11/12/2020'), 0.68214, 0.79991, 0.80251, 0.32961, 0.43471],
      [5, new Date('11/13/2020'), 0.24425, 0.25392, 0.83982, 0.14712, 0.66772],
      [6, new Date('11/14/2020'), 0.97246, 0.08954, 0.74404, 0.55464, 0.76964],
      [7, new Date('11/15/2020'), 0.28657, 0.20895, 0.96845, 0.08725, 0.29215],
    ];

    return (
      <div className="cadViewer">
        <ClickMenu
          show={this.state.isMenuVisible}
          x={this.state.menuX}
          y={this.state.menuY}
          points={this.points}
          onClick={this.onMenuClicked}
        ></ClickMenu>
        <CalibrationInputForm
          show={this.state.isInputVisible}
          point={this.state.selectedPoint}
          onSave={this.onInputClosed}
        ></CalibrationInputForm>
        <Alert
          style={{ opacity: this.state.alertShow ? 0.9 : 0 }}
          variant={this.state.alertState}
          className="alert m-2"
        >{this.state.alertStr}
        </Alert>
        <canvas
          ref={(cnv) => {
            this.cnv = cnv;
          }}
          className="w-100"
          onMouseMove={this.onMouseMove}
          onClick={this.onMouseLeftClick}
          onContextMenu={this.onMouseRightClick}
        ></canvas>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Date</th>
                <th scope='col'>Long</th>
                <th scope='col'>Lat</th>
                <th scope='col'>MaxLoad(kN)</th>
                <th scope='col'>MaxDis(mm)</th>
                <th scope='col'>E-Inverse</th>
              </tr>
            </thead>
            <tbody>
              {dummy.map((row, i) => <tr key={i + 'i'}>
                {row.map((item, j) => <DataCell key={j + 'j'}>{item}</DataCell>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default CadViewer;
