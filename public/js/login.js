/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status == 'success') {
      showAlert('success', 'Signed up succcessfully');

      window.setTimeout(() => {
        location.assign('/');
      }, 1100);
    }
  } catch (err) {
    if (err.response.data.error.code === 11000) {
      return showAlert('error', 'This email has already exist!');
    }
    if (err.response.data.error.errors.passwordConfirm) {
      return showAlert('error', 'Passwords do not match');
    }
    showAlert('error', `${err.response.data.message}`);
    console.log(err.response);
  }
};

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status == 'success') {
      showAlert('success', 'Logged in sucessfully');

      window.setTimeout(() => {
        location.assign('/');
      }, 1100);
    }
  } catch (err) {
    showAlert('error', `${err.response.data.message}`);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    // RELOAD PAGE
    if (res.data.status == 'success') location.reload();
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! try again');
  }
};
