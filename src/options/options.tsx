import React from 'react';
import ReactDOM from 'react-dom';
import SettingsPage from '../window/SettingsPage';
import { ChatProvider } from '../context/ChatContext';
import '../styles/globals.css';

const OptionsPage: React.FC = () => {
  return (
    <ChatProvider>
      <SettingsPage />
    </ChatProvider>
  );
};

ReactDOM.render(<OptionsPage />, document.getElementById('root')); 