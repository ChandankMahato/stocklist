import React from 'react';
import './toast.css'; // Make sure to include your CSS

const Toast = ({ message, type, show }) => {
  return (
    <div className={`toast ${type} ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
