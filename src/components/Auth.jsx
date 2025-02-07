import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import './Auth.css';

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const phrase = "Edit your resume effortlessly!";
  const typingSpeed = 100; // Speed of typing
  const deleteSpeed = 50; // Speed of deleting
  const pauseBeforeDelete = 2000; // Pause after typing before deleting

  useEffect(() => {
    if (isDeleting) {
      // Deleting effect
      if (typingIndex > 0) {
        setTimeout(() => setTypingIndex(typingIndex - 1), deleteSpeed);
      } else {
        setIsDeleting(false);
      }
    } else {
      // Typing effect
      if (typingIndex < phrase.length) {
        setTimeout(() => setTypingIndex(typingIndex + 1), typingSpeed);
      } else {
        setTimeout(() => setIsDeleting(true), pauseBeforeDelete); // Pause before deleting
      }
    }
  }, [typingIndex, isDeleting]);

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
      onLoginSuccess();
      navigate("/upload");
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">JobTrackPro</h1>
      <div className="typing-effect">{phrase.substring(0, typingIndex)}</div>

      <div className="input-container">
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
        />
      </div>

      <div className="input-container">
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>

      <div className="auth-buttons">
        <button onClick={handleSignup}>Sign Up</button>
        <button onClick={handleLogin}>Login</button>
      </div>

      <p className="footer-text">Already have an account? Login to continue.</p>
    </div>
  );
}
