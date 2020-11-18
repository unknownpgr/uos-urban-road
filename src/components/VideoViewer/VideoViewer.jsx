import React from "react";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import "./videoViewer.scss";

function VideoViewer() {
  return <table className="videoViewer">
    <tbody>
      <tr>
        <td></td><td>
          <VideoPlayer label="top" src="/api/stream"></VideoPlayer>
        </td><td></td>
      </tr>
    </tbody>
    <tbody>
      <tr>
        <td>
          <VideoPlayer label="left"></VideoPlayer>
        </td><td></td><td>
          <VideoPlayer label="right"></VideoPlayer>
        </td>
      </tr>
    </tbody>
    <tbody>
      <tr>
        <td></td><td>
          <VideoPlayer label="bottom"></VideoPlayer>
        </td><td></td>
      </tr>
    </tbody>
  </table>;
}

export default VideoViewer;