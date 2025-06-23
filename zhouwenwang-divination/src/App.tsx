import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Layout } from './components/layout';
import ElectronInfo from './components/ElectronInfo';
import { isElectron } from './utils/electron';
import './App.css';

function App() {
  // 在 Electron 环境中使用 HashRouter，在 Web 环境中使用 BrowserRouter
  const Router = isElectron() ? HashRouter : BrowserRouter;
  
  return (
    <Router>
      <Layout />
      <ElectronInfo />
    </Router>
  );
}

export default App;
