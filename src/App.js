import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"; // Firebase auth
import StockForm from "./Component/stockForm";
import DisplayTransactions from "./Component/display";
import EditStockForm from "./Component/EditForm";
import "./App.css"; // Global styles

function App() {
  const [user, setUser] = useState(null); // Store the logged-in user
  const [loading, setLoading] = useState(true); // Loading state
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once we know the user state
    });

    return () => unsubscribe();
  }, [auth]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Error during Google sign-in", error);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
    });
  };

  const PrivateRoute = ({ children }) => {
    const navigate = useNavigate(); // Now useNavigate is inside the router context
    useEffect(() => {
      if (!loading && (!user || (user.email !== "cmahato2000@gmail.com" || user.email !== "tulsisingh65@gmail.com"))) {
        navigate("/"); // Redirect to home page if not logged in or not the correct user
      }
    }, [loading, user, navigate]);

    if (loading) {
      return <div>Loading...</div>;
    }
    return user && ( user.email ==="cmahato2000@gmail.com" ||  user.email === "tulsisingh65@gmail.com") ? children : null;
  };

  return (
    <Router>
      <div className="App">
        <header className="header">
          <h3>Stock List</h3>
          <nav>
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/entry">Entry</Link>
              </li>
              <li>
                <Link to="/edit">Edit</Link>
              </li>
              {user ? (
                <li>
                  <button onClick={handleLogout}>Logout</button>
                </li>
              ) : (
                <li>
                  <button onClick={handleGoogleSignIn}>Login</button>
                </li>
              )}
            </ul>
          </nav>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<DisplayTransactions />} />
          <Route path="/entry" element={<PrivateRoute><StockForm /></PrivateRoute>} />
          <Route path="/edit" element={<PrivateRoute><EditStockForm /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
