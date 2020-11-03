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

function getVariable(self, varName, label, type = "text", defaultValue = 0) {
  if (self.state[varName] === undefined) self.state[varName] = defaultValue;
  return {
    type,
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
      isLoading: true,
      isMenuVisible: false,
      isInputVisible: false,
      selectedPoint: {},
      selectedVars: [],
      menuX: 0,
      menuY: 0,
      err: false,
    };
    this.points = [
      { vars: ["pax", "pay"], text: "포인트 평면도 A" },
      { vars: ["pbx", "pby"], text: "포인트 평면도 B" },
      { vars: ["pcy"], text: "포인트 측면도 A" },
      { vars: ["pdy"], text: "포인트 측면도 B" },
    ];
    this.vars = {
      pax: getVariable(this, "pax", "X", "number"),
      pay: getVariable(this, "pay", "Y", "number"),
      pbx: getVariable(this, "pbx", "X", "number"),
      pby: getVariable(this, "pby", "Y", "number"),
      pcy: getVariable(this, "pcy", "Height", "number"),
      pdy: getVariable(this, "pdy", "Height", "number"),
    };
    this.x = 0;
    this.y = 0;
  }

  onMouseLeftClick(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.setState({ isMenuVisible: false });
  }

  onMouseRightClick(event) {
    event.preventDefault();
    this.setState({
      isMenuVisible: !this.state.isMenuVisible,
      menuX: event.clientX,
      menuY: event.clientY,
    });
  }

  onMouseMove(event) {
    if (!(this.ctx && this.cnv && this.cad)) return;
    let ctx = this.ctx;

    // Draw CAD image
    ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
    ctx.drawImage(this.cad, 0, 0);

    // Get mouse position
    let [x, y, scaleX] = px2cnv(this.cnv, event.clientX, event.clientY);
    this.x = x;
    this.y = y;

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

  onSetPoint(event, point) {
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
        this.setState({ isLoading: false });
      };
      img.src = fileFullPath;
    } catch {
      this.setState({ err: true });
    }
  }

  render() {
    let menu = this.points.map((point) => ({
      onClick: (e) => this.onSetPoint(e, point),
      ...point,
    }));
    return (
      <div className="cadViewer">
        {this.state.isLoading ? (
          <Alert
            variant={this.state.err ? "danger" : "primary"}
            className="alert m-2"
          >
            {this.state.err
              ? "An error occurred while loading the CAD file."
              : "Loading image..."}
          </Alert>
        ) : undefined}
        <div className="viewer">
          <canvas
            ref={(cnv) => {
              this.cnv = cnv;
            }}
            className="w-100"
            onMouseMove={this.onMouseMove}
            onClick={this.onMouseLeftClick}
            onContextMenu={this.onMouseRightClick}
          ></canvas>
          <PositionInputForm
            text={this.state.selectedPoint.text}
            show={this.state.isInputVisible}
            vars={this.state.selectedVars.map((x) => this.vars[x])}
            onSave={this.onInputSave}
          ></PositionInputForm>
          <ClickMenu
            hidden={!this.state.isMenuVisible}
            x={this.state.menuX}
            y={this.state.menuY}
            menu={menu}
          ></ClickMenu>
        </div>
        <div class="table">
          <table>
            <thead>
              <th scope='col'>#</th>
              <th scope='col'>MaxLoad(kN)</th>
              <th scope='col'>MaxDis(mm)</th>
              <th scope='col'>E-Inverse</th>
            </thead>
          </table>
        </div>
      </div>
    );
  }
}

export default CadViewer;
