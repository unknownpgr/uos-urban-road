import React from "react";
import AppContext from "../Context/AppContext";
import { Redirect, Route, withRouter, Link } from "react-router-dom";
import axios from "axios";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import Viewer from "../Viewer/Viewer";

class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { time: (new Date() + "").substring(0, 24) };
    this.intervalKey = 0;
  }

  componentDidMount() {
    this.intervalKey = setInterval(() =>
      this.setState({ time: (new Date() + "").substring(0, 24) })
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalKey);
  }

  render() {
    return this.state.time;
  }
}

class App extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);

    this.state = {
      username: "",
      tab: "view",
      cads: [],
    };
  }

  componentDidMount() {
    let tab = this.props.location.pathname;
    this.setState({ tab });
    axios
      .get(
        "http://web-dev.iptime.org:3001/api/username?token=" +
          this.context.token
      )
      .then((res) => {
        if (res.data.status !== "ok") {
          // this.context.setToken(undefined);
        }
        // else
        this.setState({ username: res.data.data });
      });
    axios.get("http://web-dev.iptime.org:3001/api/cads").then((res) => {
      if (res.data) {
        this.setState({ cads: res.data });
      }
    });
  }

  render() {
    // Go to login page if user is not logged in.
    if (!this.context.token) return <Redirect to="/login"></Redirect>;
    let tabs = [];
    let routes = [];
    Object.keys(this.state.cads).forEach((cad, i) => {
      // Make tabs
      let tabName = cad.replace(".pdf", "");
      let href = `/cads/${tabName}`;
      let tab = (
        <Nav.Item key={i}>
          <Nav.Link as={Link} to={href} eventKey={href}>
            {tabName}
          </Nav.Link>
        </Nav.Item>
      );
      tabs.push(tab);

      // Make routes associated to tab
      let route = (
        <Route path={href} key={i}>
          <Viewer file={cad} data={this.state.cads[cad]}></Viewer>
        </Route>
      );
      routes.push(route);
    });
    return (
      <>
        <Navbar bg="dark" variant="dark" className="justify-content-between">
          <span>
            <Navbar.Brand href="https://www.ex.co.kr/" target="_blank">
              <img
                src="/img/logo.png"
                height="20"
                className="d-inline-block align-top mt-1"
                alt=""
              />
            </Navbar.Brand>
            <Navbar.Brand>토공다짐도 자동화시스템</Navbar.Brand>
          </span>
          <Navbar.Text>
            <Clock></Clock>
          </Navbar.Text>
          <span>
            <Navbar.Text className="mr-2">
              You are logged in as {this.state.username}
            </Navbar.Text>
            <Button className="btn-secondary">Logout</Button>
          </span>
        </Navbar>

        <Container className="mt-4">
          <Nav
            variant="tabs"
            activeKey={this.state.tab}
            onSelect={(selectedKey) => {
              this.setState({ tab: selectedKey });
            }}
          >
            <Nav.Item>
              <Nav.Link as={Link} to="/" eventKey="/">
                실시간 뷰
              </Nav.Link>
            </Nav.Item>
            {tabs}
          </Nav>
          <Route path="/cads">{routes}</Route>
          <Route exact path="/">
            VIEW
          </Route>
        </Container>
      </>
    );
  }
}

export default withRouter(App);
