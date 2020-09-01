import React from "react";
import AppContext from "../Context/AppContext";
import { Redirect, Route, withRouter, Link } from "react-router-dom";
import axios from "axios";
import { Navbar, Nav, Button, Container } from "react-bootstrap";

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
      maps: [],
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
        this.setState({ maps: ["Map1", "Map2", "Map3", "Map4", "Map5"] });
      });
  }

  render() {
    // Go to login page if user is not logged in.
    if (!this.context.token) return <Redirect to="/login"></Redirect>;
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
            {this.state.maps.map((map, i) => (
              <Nav.Item key={i}>
                <Nav.Link
                  as={Link}
                  to={`/maps/${map}`}
                  eventKey={`/maps/${map}`}
                >
                  {map}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
          <Route path="/maps">
            {this.state.maps.map((map, i) => (
              <Route path={`/maps/${map}`} key={i}>
                {map}
              </Route>
            ))}
          </Route>
          <Route exact path="/">
            VIEW
          </Route>
        </Container>
      </>
    );
  }
}

export default withRouter(App);
