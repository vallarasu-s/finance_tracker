import React from 'react';
import LoginForm from '../components/LoginForm';

/**
 * Registration page wrapping the shared authentication form.
 */
export default function Register(props) {
  return <LoginForm {...props} initialMode="register" />;
}
