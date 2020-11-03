import React from "react"
import VideoPlayer from "../VideoPlayer/VideoPlayer"
import "./videoViewer.scss"

function VideoViewer() {
  return <table class="videoViewer">
    <tr>
      <td></td><td>
        <VideoPlayer label="top"></VideoPlayer>
      </td><td></td>
    </tr>
    <tr>
      <td>
        <VideoPlayer label="left"></VideoPlayer>
      </td><td></td><td>
        <VideoPlayer label="right"></VideoPlayer>
      </td>
    </tr>
    <tr>
      <td></td><td>
        <VideoPlayer label="bottom"></VideoPlayer>
      </td><td></td>
    </tr>
  </table>
}

export default VideoViewer