import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { loadImage } from '../../libs/imageUtil';
import VideoPlayer from './VideoPlayer/VideoPlayer';
import './videoViewer.scss';

const INTERVAL_RETRY = 2000;
const INTERVAL_REFRESH = 80;

class VideoViewer extends React.Component {
  constructor(props) {
    super(props);

    this.updateStream = this.updateStream.bind(this);

    this.state = {
      stream: null,
      isComponentMounted: true,
    };
  }

  async updateStream() {
    if (!this.state.isComponentMounted) return;
    try {
      let result = await loadImage('/api/stream?hash=' + Date.now());
      this.setState({ stream: result });
      setTimeout(this.updateStream, INTERVAL_REFRESH);
    } catch {
      this.setState({ stream: null });
      setTimeout(this.updateStream, INTERVAL_RETRY);
    }
  }

  componentDidMount() {
    this.setState({ isComponentMounted: true });
    this.updateStream();
  }

  componentWillUnmount() {
    this.setState({ isComponentMounted: false });
  }

  render() {
    return (
      <table className='videoViewer'>
        <tbody>
          <tr>
            <td>
              <Form className='mb-1'>
                <h4>스냅샷</h4>
                <Form.Group className='mr-3'>
                  <Form.Label htmlFor='snapshotTerm'>저장 주기</Form.Label>
                  <Form.Control
                    type='number'
                    id='snapshotTerm'
                    placeholder='단위 : 초(second)'></Form.Control>
                </Form.Group>
                <Form.Group className='mx-1 row'>
                  <Form.Check
                    type='checkbox'
                    className='mx-1'
                    label='Top'
                    checked='true'></Form.Check>
                  <Form.Check
                    type='checkbox'
                    className='mx-1'
                    label='Left'
                    checked='true'></Form.Check>
                  <Form.Check
                    type='checkbox'
                    className='mx-1'
                    label='Right'
                    checked='true'></Form.Check>
                  <Form.Check
                    type='checkbox'
                    className='mx-1'
                    label='Bottom'
                    checked='true'></Form.Check>
                </Form.Group>
                <Button className='btn-primary'>설정 저장</Button>
              </Form>
            </td>
            <td>
              <VideoPlayer
                label='top'
                src={this.state.stream}
                index={0}></VideoPlayer>
            </td>
            <td></td>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <td>
              <VideoPlayer
                label='left'
                src={this.state.stream}
                index={1}></VideoPlayer>
            </td>
            <td></td>
            <td>
              <VideoPlayer
                label='right'
                src={this.state.stream}
                index={2}></VideoPlayer>
            </td>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <td></td>
            <td>
              <VideoPlayer
                label='bottom'
                src={this.state.stream}
                index={3}></VideoPlayer>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    );
  }
}

export default VideoViewer;
