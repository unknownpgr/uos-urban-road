import React, { useContext } from "react";
import AppContext from "../Context/AppContext";
import { Redirect } from "react-router-dom";
import axios from "axios";

class App extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);

    this.state = {
      username: "",
    };
  }

  componentDidMount() {
    axios
      .get(
        "http://web-dev.iptime.org:3001/api/username?token=" +
          this.context.token
      )
      .then((res) => {
        if (res.data.status !== "ok") {
          this.context.setToken(undefined);
        } else this.setState({ username: res.data.data });
      });
  }

  render() {
    // Go to login page if user is not logged in.
    if (!this.context.token) return <Redirect to="/login"></Redirect>;
    return <div>Main page</div>;
  }
}

export default App;
