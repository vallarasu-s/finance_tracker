import React from 'react';
import LoginForm from '../components/LoginForm';

/**
 * Sign-in page wrapping the shared authentication form.
 */
export default function Login(props) {
  return <LoginForm {...props} initialMode="login" />;
}
