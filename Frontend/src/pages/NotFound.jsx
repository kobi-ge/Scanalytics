import { Link } from 'react-router';
import "../App.css"

export default function NotFound() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-600 mt-4">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="inline-block mt-6 text-[#967f4a] font-bold hover:underlineTransition">Back to Home</Link>
    </div>
  );
}