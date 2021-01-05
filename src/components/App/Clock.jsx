import React from 'react';

export class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { time: (new Date() + '').substring(0, 24) };
    this.intervalKey = 0;
  }

  componentDidMount() {
    this.intervalKey = setInterval(() =>
      this.setState({ time: (new Date() + '').substring(0, 24) })
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalKey);
  }

  render() {
    return <div className='clock'>{this.state.time}</div>;
  }
}
