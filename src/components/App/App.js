import React from "react";
import AppContext from "../Context/AppContext";
import { Redirect, Route, withRouter, Link } from "react-router-dom";
import axios from "axios";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import Viewer from "../Viewer/Viewer";
import VideoViewer from "../VideoViewer/VideoViewer";

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

    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    let tab = this.props.location.pathname;
    this.setState({ tab });

    // Get username
    axios.get("/api/username?token=" + this.context.token)
      .then((res) => { this.setState({ username: res.data.data }); })
      .catch((err) => {
        console.log(err);
        this.context.setToken(undefined);
        // This code is just for debugging.
        // this.setState({ username: err.response.data.data });
      });

    // Get cad file list
    axios.get("/api/cads")
      .then((res) => {
        if (res.data) { this.setState({ cads: res.data }); }
      });
  }

  logout() {
    axios.post("/api/logout?token=" + this.context.token)
      .then(() => { this.context.setToken(undefined) })
      .catch(err => {
        console.log(err)
      })
  }

  render() {
    // Go to login page if user is not logged in.
    if (!this.context.token) return <Redirect to="/login"></Redirect>;

    let tabs = [];
    let routes = [];
    Object.keys(this.state.cads).forEach((cad, i) => {
      // Make tabs from CAD file data
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
          <Navbar.Text><Clock /></Navbar.Text>
          <span>
            <Navbar.Text className="mr-2">
              You are logged in as {this.state.username}
            </Navbar.Text>
            <Button className="btn-secondary" onClick={this.logout}>Logout</Button>
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
            {/* Video viewer */}
            <table>
              <tr>
                <td></td><td>
                  <VideoViewer label="top"></VideoViewer>
                </td><td></td>
              </tr>
              <tr>
                <td>
                  <VideoViewer label="left"></VideoViewer>
                </td><td></td><td>
                  <VideoViewer label="right"></VideoViewer>
                </td>
              </tr>
              <tr>
                <td></td><td>
                  <VideoViewer label="bottom"></VideoViewer>
                </td><td></td>
              </tr>
            </table>
          </Route>
        </Container>
      </>
    );
  }
}

export default withRouter(App);
