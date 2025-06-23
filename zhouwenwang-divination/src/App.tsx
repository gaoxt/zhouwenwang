import { BrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
