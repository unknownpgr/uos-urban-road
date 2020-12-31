import React from 'react';
import AppContext from '../Context/AppContext';
import { Redirect, Route, withRouter, Link } from 'react-router-dom';
import api from '../../libs/api';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import CadViewer from '../CadViewer/CadViewer';
import VideoViewer from '../VideoViewer/VideoViewer';
import './app.scss';
import { Clock } from './Clock';

class App extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);

    this.state = {
      username: '',
      tab: 'view',
      sections: [],
    };

    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    let tab = this.props.location.pathname;
    this.setState({ tab });

    // Get username
    api
      .get('/username?token=' + this.context.token)
      .then((res) => {
        this.setState({ username: res.data.data });
      })
      .catch((err) => {
        console.log(err);
        this.context.setToken(undefined);
        // This code is just for debugging.
        // this.setState({ username: err.response.data.data });
      });

    // Get station list
    api.get('/sections?token=' + this.context.token).then((res) => {
      if (res.data) {
        this.setState({ ...res.data });
      }
    });
  }

  logout() {
    api
      .post('/logout?token=' + this.context.token)
      .then(() => {
        this.context.setToken(undefined);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {
    // Go to login page if user is not logged in.
    if (!this.context.token) return <Redirect to='/login'></Redirect>;

    let tabs = [];
    let routes = [];
    this.state.sections.forEach((section, i) => {
      // Make tabs from CAD file data
      let tabName = section.section;
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
          <CadViewer data={section}></CadViewer>
        </Route>
      );
      routes.push(route);
    });

    return (
      <div className='app'>
        {/* Top bar */}
        <Navbar
          bg='dark'
          variant='dark'
          className='justify-content-between py-3'>
          <span className='ml-4'>
            <Navbar.Brand href='https://www.ex.co.kr/' target='_blank'>
              <img
                src='/img/logo.png'
                height='20'
                className='d-inline-block align-top'
                style={{ marginTop: '5.5px' }}
                alt=''
              />
            </Navbar.Brand>
            <Navbar.Brand>토공다짐도 자동화시스템</Navbar.Brand>
          </span>
          <Navbar.Text>
            <Clock />
          </Navbar.Text>
          <span className='mr-4'>
            <Navbar.Text className='mr-4'>
              You are logged in as {this.state.username}
            </Navbar.Text>
            <Button className='btn-secondary' onClick={this.logout}>
              Logout
            </Button>
          </span>
        </Navbar>

        {/* Main container */}
        <Container className='mt-4 mainContainer'>
          {/* Horizontal Navigation */}
          <Nav
            variant='tabs'
            activeKey={this.state.tab}
            onSelect={(selectedKey) => {
              this.setState({ tab: selectedKey });
            }}>
            <Nav.Item>
              <Nav.Link as={Link} to='/' eventKey='/'>
                실시간 뷰
              </Nav.Link>
            </Nav.Item>
            {tabs}
          </Nav>

          <div className='viewers'>
            <Route path='/cads'>{routes}</Route>
            <Route exact path='/'>
              <VideoViewer></VideoViewer>
            </Route>
          </div>
        </Container>

        {/* Footer */}
        <footer className='page-footer gray pt-4 h-25'>
          <div className='footer-copyright text-center py-4'>
            © 2020 Copyright :
            <a href='http://urbanscience.uos.ac.kr/'>
              서울시립대학교 국제도시과학대학원
            </a>
          </div>
        </footer>
      </div>
    );
  }
}

export default withRouter(App);
