import React, { Component } from 'react';
import api from 'libs/api';
import AppContext from 'contexts/AppContext';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import './editor.scss';

function EditField({ filename, name, setName, available }) {
  return (
    <div className="edit-field">
      <div>
        {filename}
      </div>
      <img src={api.host + "/cadimg/" + filename} className="preview"></img>
      <Form.Group as={Row} >
        <Form.Label column>
          CAD 타이틀
        </Form.Label>
        <Col sm="6">
          <Form.Control
            onChange={(e) => setName(e.target.value)}
            value={name}
            readOnly={!available}
          />
        </Col>
      </Form.Group>
    </div>
  );
}

class Editor extends Component {

  static contextType = AppContext;

  constructor(props) {
    super(props);

    this.state = {
      files: [],
      names: [],
      available: true
    };
  }

  refresh = async () => {
    let response = await api.get('/cads');
    let files = response.data;
    let names = files.map(x => x.replace('.png', '').split('_')[1]);
    this.setState({ files, names });
  };

  update = async (i) => {
    this.setState({ available: false });
    try {
      let data = [];
      this.state.files.forEach((fileName, i) => {
        data.push([fileName, this.state.names[i]]);
      });
      console.log(data);
      let result = await api.post('/rename', data);
      alert(result.data.msg);
    } catch (e) {
      console.log(e);
      alert('Error occurred : ' + e);
    }
    this.refresh();
    this.setState({ available: true });
  };

  componentDidMount() {
    this.refresh();
  }

  render() {
    return (
      <Container className="editor">
        <div>
          {this.state.files.map((name, i) => {

            const setName = (name) => {
              let names = [...this.state.names];
              names[i] = name;
              this.setState({ names });
            };

            return <EditField
              key={i}
              filename={name}
              name={this.state.names[i]}
              setName={setName}
              available={this.state.available}
            />;
          })}
        </div>
        <div>
          <Button
            onClick={this.update}
            disabled={!this.state.available}>
            Update
        </Button>
        </div>
      </Container>
    );
  }
}

export default Editor;