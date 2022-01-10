/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, signUp } from './login';
import { updateSettings } from './updateSettings';

// DOM
const mapBox = document.getElementById('map');
const signUpForm = document.querySelector('#formSignUp');
const loginForm = document.querySelector('#formLogin');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.getElementById('form-userData');
const updateUserPassword = document.getElementById('form-user-password');

// DELIGATION
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (signUpForm) {
  signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // VALUES
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    signUp(name, email, password, passwordConfirm);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (updateUserForm) {
  updateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    document.getElementById('btn-save-setting').textContent = 'Updating ...';
    // VALUES
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    await updateSettings(form, 'data');
    document.getElementById('btn-save-setting').textContent = 'Save settings';
  });
}

if (updateUserPassword) {
  updateUserPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('btn-save-password').textContent = 'Updating ...';

    // VALUES
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.getElementById('btn-save-password').textContent = 'Save password';
    passwordCurrent = '';
    password = '';
    passwordConfirm = '';
  });
}
