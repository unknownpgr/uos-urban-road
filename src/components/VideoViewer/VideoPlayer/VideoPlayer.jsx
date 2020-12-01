import React, { useRef } from 'react';
import './videoPlayer.scss';

/**
 * Draw a part of given image(src) on canvas.
 * Assume that given image is a vertically concatenated image of 4 small sub-image.
 * Index is the index of sub-image to draw
 *
 * @param {String,Image,Number} parameter
 */
function VideoPlayer({ label, src, index }) {
  let cnv = useRef(null);
  if (cnv.current != null && src != null) {
    let ctx = cnv.current.getContext('2d');
    ctx.drawImage(src, 0, (-src.height * index) / 4);
  }
  return (
    <div className='videoPlayer'>
      <div className='label'>{label}</div>
      {src ? (
        <canvas width={src.width} height={src.height / 4} ref={cnv}></canvas>
      ) : (
        <div className='error'>No stream source supplied.</div>
      )}
    </div>
  );
}

export default VideoPlayer;
