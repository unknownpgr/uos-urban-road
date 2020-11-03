import React from "react";
import "./videoPlayer.scss"

function VideoPlayer(props) {
  return <div className="videoPlayer">
    <div className="inner">
      <div>{props.label}</div>
      {props.url ? '' : <div>Video source is not supplied.</div>}
    </div>
  </div>
}

export default VideoPlayer