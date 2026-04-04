/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <Router>
      <main className="min-h-screen bg-black">
        <Routes>
          <Route path="/404" element={<NotFound />} />
          <Route path="/" element={<Navigate to="/404" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}
