import React from "react";
import "./videoPlayer.scss"

function VideoPlayer(props) {
  return <div className="videoPlayer">
    <div className="inner">
      {props.label}
    </div>
  </div>
}

export default VideoPlayer