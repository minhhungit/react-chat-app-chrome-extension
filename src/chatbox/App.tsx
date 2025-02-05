import React, { useEffect, useState } from "react";
import { ChatProvider } from "../context/ChatContext";
import ChatWindow from "./ChatWindow";
import Settings from "../settings/SettingsPage";

import "../styles/globals.css";
import { Toaster } from "react-hot-toast"
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { db } from "@/utils/IndexedDBWrapper";

const App: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatures = async () => {
      const result = await db.get('features');
      setFeatures(result || []);
      setIsLoading(false);
    };
    loadFeatures();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }

  return (
    <BrowserRouter>
      <ChatProvider>
        <Routes>
          {/* Redirect to settings if no features available */}
          <Route 
            path="/" 
            element={features.length > 0 ? <ChatWindow /> : <Navigate to="/settings" replace />} 
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </ChatProvider>      
    </BrowserRouter>
  );
};

export default App;