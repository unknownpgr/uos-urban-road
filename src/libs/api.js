import axios from 'axios';

const host = 'https://api.road.urbanscience.uos.ac.kr';

const api = {
  host,
  get: (url, params) => axios.get(host + url, params),
  post: (url, params) => axios.post(host + url, params),
};
export default api;