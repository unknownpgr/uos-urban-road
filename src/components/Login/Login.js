import React from "react";
import "./login.scss";
import { Container, Card, Button, Form } from "react-bootstrap";

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: null,
      pw: null,
    };

    this.handleID = this.handleID.bind(this);
    this.handlePw = this.handlePw.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  handleID(event) {
    this.setState({ id: event.target.value });
  }

  handlePw(event) {
    this.setState({ pw: event.target.value });
  }

  handleLogin() {
    alert(this.state.id + "/" + this.state.pw);
  }

  render() {
    return (
      <Container className="login">
        <Card className="loginCard">
          <Card.Body>
            <img src="./img/logo.png" className="w-75" />
            <Card.Title className="mt-4">
              한국도로공사 토공 다짐도 자동화 시스템
            </Card.Title>
            <Form>
              <Form.Group>
                <Form.Label>User ID</Form.Label>
                <Form.Control
                  type="text"
                  value={this.state.id}
                  onChange={this.handleID}
                ></Form.Control>
              </Form.Group>
            </Form>
            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={this.state.pw}
                onChange={this.handlePw}
              ></Form.Control>
            </Form.Group>
            <Button onClick={this.handleLogin}>Login</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default Login;
