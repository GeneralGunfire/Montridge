import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ArticleDetail from './components/ArticleDetail';

export default function App() {
  return (
    <Router basename="/intelligence">
      <main className="min-h-screen bg-black">
        <Routes>
          <Route path="/:id" element={<ArticleDetail />} />
        </Routes>
      </main>
    </Router>
  );
}
