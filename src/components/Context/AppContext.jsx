import React, { useState } from 'react';

const AppContext = React.createContext();

function getCookie(key) {
  let list = document.cookie.split('; ');
  for (let i = 0; i < list.length; i++) {
    let [_key, value] = list[i].split('=');
    if (key === _key) return value;
  }
}

function Provider(props) {
  const [token, _setToken] = useState(getCookie('token'));
  return (
    <AppContext.Provider
      value={{
        token,
        setToken: (token) => {
          document.cookie = 'token=' + token;
          _setToken(token);
        },
      }}>
      {props.children}
    </AppContext.Provider>
  );
}

export const AppProvider = Provider;
export const AppConsumer = AppContext.Consumer;
export default AppContext;
