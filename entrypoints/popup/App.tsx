import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-w-[400px] flex flex-col items-center justify-center p-4">
      <div className="flex justify-center items-center gap-8 mb-8">
        <a
          href="https://wxt.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
        >
          <img src={wxtLogo} className="h-16 w-auto" alt="WXT logo" />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
        >
          <img
            src={reactLogo}
            className="h-16 w-auto animate-spin-slow"
            alt="React logo"
          />
        </a>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-gray-900 dark:text-white">
        WXT Example
      </h1>

      <div className="space-y-8">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          count is {count}
        </button>

        <p className="text-gray-700 dark:text-gray-300">
          Edit{" "}
          <code className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded">
            src/App.tsx
          </code>{" "}
          and save to test HMR
        </p>
      </div>

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        Click on the WXT and React logos to learn more
      </p>
    </div>
  );
}

export default App;
