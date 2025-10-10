import React from "react";
import { UIAgent } from "./agents/UIAgent";

const App: React.FC = () => {
  return (
    <main className="flex h-full flex-col">
      <UIAgent />
    </main>
  );
};

export default App;
