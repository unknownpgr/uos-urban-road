import React from "react";
import axios from "axios";
import { Alert, ButtonGroup, Button, Modal, Form } from "react-bootstrap";
import "./cadViewer.scss";
import AppContext from "../Context/AppContext";

function px2cnv(cnv, x, y) {
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
        display: props.hidden ? "none" : undefined,
        left: props.x,
        top: props.y,
      }}
    >
      {props.menu?.map((menu, i) => (
        <Button onClick={menu.onClick} key={i}>
          {menu.text}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function LabeledInput(props) {
  let { value, type, label, setValue } = props;
  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        onChange={setValue}
        value={value()}
        type={type}
      ></Form.Control>
    </Form.Group>
  );
}

function PositionInputForm(props) {
  return (
    <Modal show={props.show}>
      <Modal.Header>
        <Modal.Title>캘리브레이션 {props.text} 세팅</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {props.vars?.map((variable, i) => (
            <LabeledInput {...variable} key={i}></LabeledInput>
          ))}
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

function getVariable(self, varName, label, defaultValue = 0) {
  if (self.state[varName] === undefined) self.state[varName] = defaultValue;
  return {
    label,
    value: () => self.state[varName],
    setValue: (event) => {
      let value = event.target.value;
      let update = {};
      update[varName] = value;
      self.setState(update);
    },
  };
}

class CadViewer extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.onMouseRightClick = this.onMouseRightClick.bind(this);
    this.onSetPoint = this.onSetPoint.bind(this);
    this.onInputSave = this.onInputSave.bind(this);
    this.state = {
      alertShow: true,
      alertStr: "Loading CAD image...",
      alertState: "primary",
      isMenuVisible: false,
      isInputVisible: false,
      selectedPoint: {},
      selectedVars: [],
      menuX: 0,
      menuY: 0,
    };
    this.points = [
      { vars: ["pax", "pay"], text: "포인트 평면도 A" },
      { vars: ["pbx", "pby"], text: "포인트 평면도 B" },
      { vars: ["pcy"], text: "포인트 측면도 A" },
      { vars: ["pdy"], text: "포인트 측면도 B" },
    ];
    this.vars = {
      pax: getVariable(this, "pax", "X"),
      pay: getVariable(this, "pay", "Y"),
      pbx: getVariable(this, "pbx", "X"),
      pby: getVariable(this, "pby", "Y"),
      pcy: getVariable(this, "pcy", "Height"),
      pdy: getVariable(this, "pdy", "Height"),
    };
    this.mouseX = 0;
    this.mouseY = 0;
  }
  onMouseLeftClick(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.setState({ isMenuVisible: false });
  }

  onMouseRightClick(event) {
    event.preventDefault();
    let rect = event.target.parentElement.parentElement.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

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

    // Get mouse position
    let [x, y, scaleX] = px2cnv(this.cnv, event.clientX, event.clientY);
    this.mouseX = x;
    this.mouseY = y;

    // Draw cursor(+)
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.cnv.height);
    ctx.moveTo(0, y);
    ctx.lineTo(this.cnv.width, y);
    ctx.stroke();

    // Draw mouse position text
    let fontSize = Math.round(scaleX * 15);
    ctx.font = fontSize + "px Ariel";
    ctx.fillText(`X:${Math.round(x)}`, 10, fontSize * 2);
    ctx.fillText(`Y:${Math.round(y)}`, 10, fontSize * 3.5);
  }

  onSetPoint(point) {
    this.setState({
      selectedPoint: point,
      selectedVars: point.vars,
      isInputVisible: true,
      isMenuVisible: false,
    });
  }

  onInputSave() {
    this.setState({ isInputVisible: false });
    axios.post("/api/pivot", {
      img: this.props.data.img,
      pax: this.state.pax,
      pay: this.state.pay,
      pbx: this.state.pbx,
      pby: this.state.pby,
      pcy: this.state.pcy,
      pdy: this.state.pdy,
      token: this.context.token,
    });
  }

  async componentDidMount() {
    try {
      this.ctx = this.cnv.getContext("2d");
      let meta = this.props.data;
      let fileFullPath = "/img/cad/" + meta.img;
      this.cnv.width = meta.w;
      this.cnv.height = meta.h;
      let img = new Image();
      img.onload = () => {
        this.cad = img;
        this.ctx.drawImage(img, 0, 0);
        this.setState({ alertShow: false });
      };
      img.src = fileFullPath;
    } catch {
      this.setState({ err: true });
    }
  }

  render() {
    let menu = this.points.map((point) => ({
      onClick: () => this.onSetPoint(point),
      ...point,
    }));
    return (
      <div className="cadViewer">
        <ClickMenu
          hidden={!this.state.isMenuVisible}
          x={this.state.menuX}
          y={this.state.menuY}
          menu={menu}
        ></ClickMenu>
        <PositionInputForm
          text={this.state.selectedPoint.text}
          show={this.state.isInputVisible}
          vars={this.state.selectedVars.map((x) => this.vars[x])}
          onSave={this.onInputSave}
        ></PositionInputForm>
        <Alert
          style={{ opacity: this.state.alertShow ? 0.9 : 0 }}
          variant={this.state.alertState}
          className="alert m-2"
        >{this.state.alertStr}</Alert>
        <div className="viewer">
          <canvas
            ref={(cnv) => {
              this.cnv = cnv;
            }}
            className="w-100"
            onMouseMove={this.onMouseMove}
            onClick={this.onMouseLeftClick}
            onContextMenu={this.onMouseRightClick}
          >
          </canvas>
        </div>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Date</th>
                <th scope='col'>MaxLoad(kN)</th>
                <th scope='col'>MaxDis(mm)</th>
                <th scope='col'>E-Inverse</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    );
  }
}

export default CadViewer;
