import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "components/App/App";
import Login from "components/Login/Login";
import * as serviceWorker from "./serviceWorker";
import { AppProvider } from "contexts/AppContext";

ReactDOM.render(
  <AppProvider>
    <React.StrictMode>
      <Router>
        <Switch>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route path="/">
            <App />
          </Route>
        </Switch>
      </Router>
    </React.StrictMode>
  </AppProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
