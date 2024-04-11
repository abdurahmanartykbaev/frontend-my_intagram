import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as ROUTES from "../constants/routes";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import slide1 from "/slide (1).jpeg";
import slide2 from "/slide (2).jpeg";
import slide3 from "/slide (3).jpeg";
import slide4 from "/slide (4).jpeg";
import slide5 from "/slide (5).jpeg";
import { ImFacebook2 as FacebookIcon } from "react-icons/im";
import { signInWithPopup } from "firebase/auth";
import { FacebookAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";

function Login() {
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isInvalid = password === "" || emailAddress === "";
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [slide1, slide2, slide3, slide4, slide5];
  useEffect(() => {
    const timer = setInterval(() => {
      if (window.innerWidth <= 640) {
        setActiveSlide(-1);
      } else {
        setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, emailAddress, password);
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      if (error) setLoading(false);
      if (error.code === "auth/user-not-found") {
        setError("User not found.");
        setEmailAddress("");
        setPassword("");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect Password. Try Again.");
        setPassword("");
      } else if (error.code === "auth/too-many-requests") {
        setError(
          "Something went wrong."
        );
        setEmailAddress("");
        setPassword("");
      } else {
        setEmailAddress("");
        setPassword("");
        setError(error.message);
      }
    }
  };

  const handleFacebookLogin = async () => {
    const db = getFirestore();

    try {
        const result = await signInWithPopup(auth, provider);
        const accessToken = credential.accessToken;

        let imageUrl = result.user.photoURL || "/images/default.png";

        const userRef = doc(db, "users", result.user.uid);
        const docSnap = await getDoc(userRef);

        let userData = {
            userId: result.user.uid,
            emailAddress: result.user.email.toLowerCase(),
            dateCreated: serverTimestamp(),
            lastSeen: serverTimestamp(),
        };

        if (!docSnap.exists()) {
            userData.image = imageUrl;
            userData.following = [];
            userData.followers = [];
            userData.bio = "";
            userData.username = result.user.email.split("@")[0].toLowerCase();
            userData.fullName = result.user.displayName;
        } else {
            const existingData = docSnap.data();
            if (existingData.image !== "/images/default.png") {
                userData.image = existingData.image;
            } else {
                userData.image = imageUrl;
            }
            userData.bio = existingData.bio ? existingData.bio : "";
            userData.following = existingData.following ? existingData.following : [];
            userData.followers = existingData.followers ? existingData.followers : [];
            userData.username = existingData.username;
            userData.fullName = existingData.fullName;
        }
        await setDoc(userRef, userData, { merge: true });

        navigate(ROUTES.DASHBOARD);
    } catch (error) {
        console.log("Error found:", error);
    }
};




  useEffect(() => {
    document.title = "Login - Instagram Clone";
  }, []);
  return (
    <div className="grid grid-cols-1 overflow-scroll lg:grid-cols-2">
      <div className="mr-4 mb-6 hidden items-center justify-center lg:flex">
        <div className="phone-frame">
          <div className="slides-container">
            {slides.map((slide, index) => (
              <img
                key={index}
                src={slide}
                alt={`Slide ${index}`}
                className={`slide ${
                  index === activeSlide ? "active__slide" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className=" top-grid -mb-36 p-5">
          <h1 className="-mx-16 flex w-full justify-center">
            <img
              src="/images/logo.png"
              alt="Instagram Logo"
              className="mt-4 mb-6 w-48 "
            />
          </h1>
          <h1 className="flex justify-center text-center ">
            <p className="mb-8 text-[16px] font-semibold text-gray-500 ">
              Login to your account.
            </p>
          </h1>
          {error && <p className="error-text">{error}</p>}
          <form method="POST" onSubmit={handleLogin}>
            <input
              type="email"
              autoComplete="email"
              required
              value={emailAddress}
              aria-label="Enter Your Email Address"
              placeholder="Email Address"
              className="input text-xs"
              onChange={({ target }) => {
                setEmailAddress(target.value), setError("");
              }}
            />
            <input
              type="password"
              autoComplete="current-password"
              required
              aria-label="Enter Your Password"
              placeholder="Password"
              value={password}
              className="input text-xs"
              onChange={({ target }) => {
                setPassword(target.value), setError("");
              }}
            />
            <button
              className={`submit ${isInvalid && " bg-opacity-40"}`}
              disabled={isInvalid}
              type="submit"
              onClick={() => setLoading(true)}
            >
              {loading ? "Logging in" : "Log in"}
            </button>
          </form>
        </div>
        <div className=" bottom-grid mt-40">
          <p className="mr-2 text-sm font-semibold">Don't have an Account?</p>
          <Link
            to={ROUTES.SIGN_UP}
            className=" text-sm font-bold text-blue-400"
          >
            Sign Up
          </Link>
        </div>
      </div>
      <br />
      <br />
      <br />
      <br />

    </div>
  );
}

export default Login;
