import React, { useContext } from "react";
import AppContext from "../Context/AppContext";
import { Redirect } from "react-router-dom";
import axios from "axios";

function App() {
  let context = useContext(AppContext);
  if (context.token) {
    return (
      <div>
        <h1>Token</h1>
        <div>{context.token}</div>
      </div>
    );
  }
  return <Redirect to="/login"></Redirect>;
}

export default App;
