import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadReceipt from './pages/UploadReceipt';
import ManualEntry from './pages/ManualEntry';
import { Navigate, Route, Routes ,BrowserRouter} from 'react-router';
import "./App.css"
import NotFound from './pages/NotFound';
import Statistics from './pages/Statistics';

// קומפוננטה להגנה על עמודים שדורשים התחברות
const PrivateRoute = ({ children }) => {
  const user = useStore((state) => state.user);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const user = useStore((state) => state.user);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dir-rtl text-right" dir="rtl">
        {user && <Navbar />}
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/" element={<PrivateRoute><div>ברוך הבא, {user?.fullName}! סך הוצאותיך: ₪{user?.totalExpenses}</div></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute><UploadReceipt /></PrivateRoute>} />
            <Route path="/manual" element={<PrivateRoute><ManualEntry /></PrivateRoute>} />
            <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
            {/* עמוד 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;