import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// If you used create-react-app, make sure your public/index.html has:
// <div id="root"></div>

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
