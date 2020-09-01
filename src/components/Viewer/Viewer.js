import React from "react";
import axios from "axios";
import { Alert } from "react-bootstrap";

class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = this.mouseMove.bind(this);
    this.state = {
      isLoading: true,
      err: false,
    };
  }

  mouseMove(event) {
    if (!(this.ctx && this.cnv && this.cad && this.cad)) return;
    let ctx = this.ctx;

    // Draw CAD image
    ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
    ctx.drawImage(this.cad, 0, 0);

    // Get mouse position
    let rect = this.cnv.getBoundingClientRect();
    let scaleX = this.cnv.width / rect.width;
    let x = (event.clientX - rect.left) * scaleX;
    let y = ((event.clientY - rect.top) * this.cnv.height) / rect.height;

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
      };
      img.src = fileFullPath;
      this.setState({ isLoading: false });
    } catch {
      this.setState({ err: true });
    }
  }

  render() {
    return (
      <>
        {this.state.isLoading ? (
          <Alert
            variant={this.state.err ? "danger" : "primary"}
            className="m-2"
          >
            {this.state.err
              ? "An error occurred while loading the CAD file."
              : "Loading image..."}
          </Alert>
        ) : undefined}
        <canvas
          ref={(cnv) => {
            this.cnv = cnv;
          }}
          className="w-100"
          onMouseMove={this.mouseMove}
        ></canvas>
      </>
    );
  }
}

export default Viewer;
