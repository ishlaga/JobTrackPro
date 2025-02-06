// src/components/Auth.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      // Check if the email is already in use
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        alert("This email is already in use. Please use a different email.");
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign Up successful!");
    } catch (error) {
      console.error(error);
      alert("Sign Up failed: " + error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      onLoginSuccess(); // Call the prop function to update authentication state
      navigate("/upload");
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}