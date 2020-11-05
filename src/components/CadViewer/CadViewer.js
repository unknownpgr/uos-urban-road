import React from "react";
import axios from "axios";
import { Alert, ButtonGroup, Button, Modal, Form } from "react-bootstrap";
import "./cadViewer.scss";
import AppContext from "../Context/AppContext";

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
          {point.varLabel}
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
        <Modal.Title>캘리브레이션 {point?.varLabel} 세팅</Modal.Title>
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

class CadCalibration {
  constructor(component, varName, varLabel, useX = true) {
    this.varName = varName;
    this.varLabel = varLabel;
    this.component = component;
    this.useX = useX;

    if (!(component.state.calibration)) component.state.calibration = {};

    component.state.calibration[varName] = {
      varName,
      varLabel,
      imgX: 0,
      imgY: 0,
      gpsX: 0,
      gpsY: 0,
    }
  }

  get(propertyName) {
    return this.component.state.calibration[this.varName][propertyName]
  }

  set(propertyName, newValue) {
    let { calibration } = this.component.state;         // Get state
    calibration[this.varName][propertyName] = newValue  // Update state
    this.component.setState({ calibration })            // Set updated state with re-rendering
  }

  getGetter(propertyName) {
    return () => this.get(propertyName)
  }

  getSetter(propertyName) {
    return (newValue) => this.set(propertyName, newValue)
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
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.onMouseRightClick = this.onMouseRightClick.bind(this);
    this.onMenuClicked = this.onMenuClicked.bind(this);
    this.onInputClosed = this.onInputClosed.bind(this);
    this.state = {
      alertShow: true,
      alertStr: "Loading CAD image...",
      alertState: "primary",
      isMenuVisible: false,
      isInputVisible: false,
      menuX: 0,
      menuY: 0,
    };
    this.imgX = 0;
    this.imgY = 0;

    // Array of calibration points
    this.points = [
      new CadCalibration(this, 'Point A', 'Calibration point A'),
      new CadCalibration(this, 'Point B', 'Calibration point B'),
      new CadCalibration(this, 'Point C', 'Calibration point C', false),
      new CadCalibration(this, 'Point D', 'Calibration point D', false),
    ]
  }

  onMouseLeftClick(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.setState({ isMenuVisible: false });
  }

  onMouseRightClick(event) {
    event.preventDefault();
    let rect = event.target.parentElement.parentElement.getBoundingClientRect();
    let x = event.clientX;
    let y = event.clientY;

    this.setState({
      isMenuVisible: !this.state.isMenuVisible,
      menuX: x,
      menuY: y,
    });
  }

  onMouseMove(event) {
    if (!(this.ctx && this.cnv && this.cad) || this.state.isMenuVisible) return;
    let ctx = this.ctx;

    // Draw CAD image
    ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
    ctx.drawImage(this.cad, 0, 0);

    // Get mouse position in pixel
    let [x, y, scaleX] = px2cnv(this.cnv, event.clientX, event.clientY);
    this.imgX = x;
    this.imgY = y;

    // Draw cursor(+)
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x, y + 32);
    ctx.moveTo(x - 32, y);
    ctx.lineTo(x + 32, y);
    ctx.stroke();

    // Draw mouse position text
    let fontSize = Math.round(scaleX * 15);
    ctx.font = fontSize + "px Ariel";
    ctx.fillText(`X:${Math.round(x)}`, x + fontSize, y + fontSize * 1.5);
    ctx.fillText(`Y:${Math.round(y)}`, x + fontSize, y + fontSize * 3);

    // Draw pivot
    ctx.beginPath()
    ctx.fillStyle = '#0000ff'
    this.points.forEach(point => {
      if (!point.isSet()) return
      let ix = point.get("imgX");
      let iy = point.get("imgY")
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + 5, iy - 10);
      ctx.lineTo(ix - 5, iy - 10);
      ctx.fillText("(" + point.get("gpsX") + "," + point.get("gpsY") + ")", ix - 10, iy - 20)
    })
    ctx.fill()
  }

  onMenuClicked(point) {
    point.set('imgX', this.imgX)
    point.set('imgY', this.imgY)
    this.setState({
      selectedPoint: point,
      isInputVisible: true,
      isMenuVisible: false,
    });
  }

  onInputClosed() {
    this.setState({ isInputVisible: false });
    axios.post('/api/cali', { data: this.state.calibration });
  }

  async componentDidMount() {
    try {
      // Get metadata
      let meta = this.props.data;

      // Set canvas
      this.cnv.width = meta.w;
      this.cnv.height = meta.h;
      this.ctx = this.cnv.getContext("2d");
      this.ctx.lineWidth = 3

      // Load image
      let img = new Image();
      img.onload = () => {
        this.cad = img;
        this.ctx.drawImage(img, 0, 0);
        this.setState({ alertShow: false });
      };
      img.src = "/img/cad/" + meta.img;
    } catch (e) {
      this.setState({ alertShow: true, alertState: 'danger', alertStr: '데이터를 로드하던 중 에러가 발생했습니다.' });
      console.error(e)
    }
  }

  render() {

    // Dummy data for demonstration
    let dummy = []
    let date = Date.now()
    for (let i = 0; i < 20; i++) {
      let current = new Date(date + 3500 * i).toLocaleDateString();
      dummy.push([i + 1, current, Math.random(), Math.random(), Math.random(), Math.random(), Math.random()])
    }

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
                {row.map((item, j) => <td key={j + 'j'}>{item + ''}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default CadViewer;
