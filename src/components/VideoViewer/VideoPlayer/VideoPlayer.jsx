import React, { useRef } from "react";
import "./videoPlayer.scss";

const INTERVAL_RETRY = 2000;
const INTERVAL_REFRESH = 80;

function VideoPlayer({ label, src, index }) {
  let cnv = useRef(null);
  if (cnv.current != null && src != null) {
    let ctx = cnv.current.getContext("2d");
    ctx.drawImage(src, 0, (-src.height * index) / 4);
  }
  return (
    <div className="videoPlayer">
      <div className="label">{label}</div>
      {src ? (
        <canvas width={src.width} height={src.height / 4} ref={cnv}></canvas>
      ) : (
        <div className="error">No stream source supplied.</div>
      )}
    </div>
  );
}

export default VideoPlayer;
