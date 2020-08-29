import React from "react";
import "./login.scss";
import { Container, Card, Form, Alert } from "react-bootstrap";
import axios from "axios";
import AppContext from "../Context/AppContext";
import { Redirect } from "react-router-dom";

class Login extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      id: "", // value of id input element
      pw: "", // value of pw input element
      err: "", // value of error message alert
      redirect: undefined, // redirect component
      isLoading: false,
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

  async handleLogin(e) {
    e.preventDefault();
    // Check ID, password length
    if (this.state.id === "") {
      this.setState({ err: "ID는 적어도 한 글자 이상이어야 합니다." });
      return;
    }
    if (this.state.pw === "") {
      this.setState({ err: "패스워드는 적어도 한 글자 이상이어야 합니다." });
      return;
    }

    // Do login process
    this.setState({ isLoading: true });
    let host = "http://web-dev.iptime.org:3001";
    let res = await axios.post(host + "/api/login", {
      id: this.state.id,
      pw: this.state.pw,
    });
    let token = res.data.token;
    if (token) {
      // If login is successful, set a token and redirect to the main page.
      this.context.setToken(token);
      this.setState({ redirect: <Redirect to="/"></Redirect> });
    } else {
      // If login fails, show error message.
      this.setState({ err: "계정이 존재하지 않거나 비밀번호가 틀렸습니다." });
    }
    this.setState({ isLoading: false });
  }

  render() {
    return (
      <>
        <div className="background"></div>
        <Container className="login">
          {this.state.redirect}
          <Card className="loginCard">
            <Card.Body>
              <img src="./img/logo.png" className="w-75" alt="한국도로공사" />
              <Card.Title className="mt-4">
                한국도로공사 토공 다짐도 자동화 시스템
              </Card.Title>
              <Form onSubmit={this.handleLogin}>
                {this.state.err ? (
                  <Alert variant={"danger"}>{this.state.err}</Alert>
                ) : undefined}
                <Form.Group>
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={this.state.id}
                    onChange={this.handleID}
                    disabled={this.state.isLoading}
                  ></Form.Control>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={this.state.pw}
                    onChange={this.handlePw}
                    disabled={this.state.isLoading}
                  ></Form.Control>
                </Form.Group>
                <Form.Control
                  type="submit"
                  className="btn btn-primary"
                ></Form.Control>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }
}

export default Login;
