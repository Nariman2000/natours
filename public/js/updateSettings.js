/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// UPDATE DATA
// TYPE IS EITHER PASSWORD OR DATA
export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://localhost:3000/api/v1/users/updateMyPassword'
      : 'http://localhost:3000/api/v1/users/updateMe';

  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status == 'success') {
      showAlert('success', `${type.toUpperCase()} updated succcessfully`);

      window.setTimeout(() => {
        location.assign('/me');
      }, 2000);
    }
  } catch (err) {
    if (err.response.data.error.code === 11000) {
      return showAlert('error', 'This email has already exist!');
    }

    if (err.response.data.message == "You're password is wrong") {
      return showAlert('error', 'Current password is wrong');
    }

    if (err.response.data.error.errors.passwordConfirm) {
      return showAlert('error', 'Passwords do not match');
    }

    console.log(err.response);
  }
};
