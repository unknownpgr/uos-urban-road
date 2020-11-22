import React from "react";
import { Button, Form } from "react-bootstrap";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import "./videoViewer.scss";

function VideoViewer() {
  return (
    <table className="videoViewer">
      <tbody>
        <tr>
          <td>
            <Form className="mb-1">
              <h4>스냅샷</h4>
              <Form.Group className="mr-3">
                <Form.Label for="snapshotTerm">저장 주기</Form.Label>
                <Form.Control
                  type="number"
                  id="snapshotTerm"
                  placeholder="단위 : 초(second)"
                ></Form.Control>
              </Form.Group>
              <Form.Group className="mx-1 row">
                <Form.Check
                  type="checkbox"
                  className="mx-1"
                  label="Top"
                  checked="true"
                ></Form.Check>
                <Form.Check
                  type="checkbox"
                  className="mx-1"
                  label="Left"
                  checked="true"
                ></Form.Check>
                <Form.Check
                  type="checkbox"
                  className="mx-1"
                  label="Right"
                  checked="true"
                ></Form.Check>
                <Form.Check
                  type="checkbox"
                  className="mx-1"
                  label="Bottom"
                  checked="true"
                ></Form.Check>
              </Form.Group>
              <Button className="btn-primary">설정 저장</Button>
            </Form>
          </td>
          <td>
            <VideoPlayer label="top" src="/api/stream"></VideoPlayer>
          </td>
          <td></td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <td>
            <VideoPlayer label="left"></VideoPlayer>
          </td>
          <td></td>
          <td>
            <VideoPlayer label="right"></VideoPlayer>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <td></td>
          <td>
            <VideoPlayer label="bottom"></VideoPlayer>
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
}

export default VideoViewer;
