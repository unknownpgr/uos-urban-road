import React from 'react';
import './login.scss';
import { Container, Card, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import AppContext from '../Context/AppContext';
import { Redirect } from 'react-router-dom';

class Login extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      id: '', // value of id input element
      pw: '', // value of pw input element
      err: '', // value of error message alert
      redirect: undefined, // redirect component
      isLoading: false,
    };

    this.onChangeID = this.onChangeID.bind(this);
    this.onChangePw = this.onChangePw.bind(this);
    this.onLogin = this.onLogin.bind(this);
  }

  onChangeID(event) {
    this.setState({ id: event.target.value });
  }

  onChangePw(event) {
    this.setState({ pw: event.target.value });
  }

  async onLogin(e) {
    e.preventDefault();
    // Check ID, password length
    if (this.state.id === '') {
      this.setState({ err: 'ID는 적어도 한 글자 이상이어야 합니다.' });
      return;
    }
    if (this.state.pw === '') {
      this.setState({ err: '패스워드는 적어도 한 글자 이상이어야 합니다.' });
      return;
    }

    // Do login process
    try {
      this.setState({ isLoading: true });
      let host = '';
      let res = await axios.post(host + '/api/login', {
        id: this.state.id,
        pw: this.state.pw,
      });
      let token = res.data.token;
      if (token) {
        // If login is successful, set a token and redirect to the main page.
        this.context.setToken(token);
        // The redirection occurs immediately after this code is executed.
        // Therefore, component state update after this code will make warning.
        this.setState({ redirect: <Redirect to='/'></Redirect> });
      } else {
        alert('Serverside error occurred.');
      }
    } catch {
      this.setState({ err: '계정이 존재하지 않거나 비밀번호가 틀렸습니다.' });
      this.setState({ isLoading: false });
    }
  }

  render() {
    return (
      <>
        <div className='background'></div>
        <Container className='login'>
          {this.state.redirect}

          {/* Main card */}
          <Card className='loginCard'>
            <Card.Body>
              <img src='/img/logo.png' className='w-75' alt='한국도로공사' />
              <Card.Title className='mt-4'>
                한국도로공사 토공 다짐도 자동화 시스템
              </Card.Title>
              <Form onSubmit={this.onLogin}>
                {/* Error alert message */}
                {this.state.err ? (
                  <Alert variant='danger'>{this.state.err}</Alert>
                ) : undefined}

                {/* ID input field */}
                <Form.Group>
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type='text'
                    value={this.state.id}
                    onChange={this.onChangeID}
                    disabled={this.state.isLoading}></Form.Control>
                </Form.Group>

                {/* Password input field */}
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type='password'
                    value={this.state.pw}
                    onChange={this.onChangePw}
                    disabled={this.state.isLoading}></Form.Control>
                </Form.Group>

                {/* Submit button */}
                <Form.Control
                  type='submit'
                  className='btn btn-primary'></Form.Control>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }
}

export default Login;
