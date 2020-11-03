import React from "react";
import "./VideoViewer.scss"

function VideoViewer(props) {
  return <div className="videoViewer">
    <div className="inner">
      {props.label}
    </div>
  </div>
}

export default VideoViewer