import axios from 'axios';

const host = 'http://api.road.urbanscience.uos.ac.kr';

const api = {
  host,
  get: (url, params) => axios.get(host + url, params),
  post: (url, params) => axios.post(host + url, params),
};
export default api;