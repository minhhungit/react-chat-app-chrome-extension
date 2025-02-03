import React from "react";
import { ChatProvider } from "../context/ChatContext";
import ChatWindow from "./ChatWindow";
import "../styles/globals.css";

const App: React.FC = () => {
  return (
    <ChatProvider>
      <ChatWindow />
    </ChatProvider> 
  );
};

export default App;