import React, { Component } from 'react';
import api from 'libs/api';
import AppContext from 'contexts/AppContext';

class Editor extends Component {
  
  static contextType = AppContext;

  constructor(props) {
    super(props);

    this.state = {
      files: []
    };
  }

  update = async () => {
    let response =  await api.get('/sections?token=' + this.context.token);
    console.log(response);
    let files = response.data;
    this.setState({ files });
  };

  componentDidMount() {
    this.update();
  }

  render() {
    return (
      <div>
        {this.state.files.map(x => <div>{x}</div>)}
      </div>
    );
  }
}

export default Editor;