import React, { useRef } from "react";
import "./videoPlayer.scss";

const INTERVAL_RETRY = 2000;
const INTERVAL_REFRESH = 80;

function VideoPlayer({ label, src }) {
  let img = useRef(null);

  function update() {
    // Set current milisecond as param just to prevent caching.
    if (img.current) setTimeout(() => img.current.src = src + '?hash=' + Date.now(), INTERVAL_REFRESH);
    else setTimeout(update, INTERVAL_RETRY);
  }

  update();

  return <div className="videoPlayer">
    <div className="label">
      {label}
    </div>
    {src ? <img
      ref={img}
      onLoad={update}
      onError={() => setTimeout(update, INTERVAL_RETRY)}
      alt="Stream is not available now">
    </img> : <div className="error">No stream source supplied.</div>}
  </div>;
}

export default VideoPlayer;