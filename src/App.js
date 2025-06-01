import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import SignIn from "./RoutComponents/SignInew";
import SignUp from "./RoutComponents/SignUp";
import Profile from "./RoutComponents/Profile";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Settings from "./RoutComponents/Settings/Settings";
import Game from "./RoutComponents/Game/Game";
import Playground from "./RoutComponents/Game/Playground";
import Game2 from "./RoutComponents/Game/Game2";
import {
  getIsAuthenticating,
  getLog,
  setIsAuthenticating,
  setLog,
  setUser,
} from "./store/slices/userReducer";
import { LinearProgress } from "@mui/material";

export default function App() {
  const dispatch = useDispatch();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.data();
      userData.uid = user.uid;
      dispatch(setUser(userData));
      dispatch(setLog(true));
    } else {
      dispatch(setLog(false));
    }
    dispatch(setIsAuthenticating(false));
  });
  function useForceUpdate() {
    const [value, setValue] = React.useState(0);
    return () => setValue((value) => value + 1);
  }
  const forceUpdate = useForceUpdate();
  const isAuthenticating = useSelector(getIsAuthenticating);
  let isLoggedIn = useSelector(getLog);
  if (isAuthenticating) {
    return <LinearProgress />;
  }
  return (
    <Routes>
      {isLoggedIn ? (
        <>
          <Route path="/profile" index element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/game_4p" element={<Game />} />
          <Route path="/game_2p" element={<Game2 />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="*" element={<Navigate replace to="/profile" />} />
        </>
      ) : (
        <>
          <Route path="/signin" element={<SignIn update={forceUpdate} />} />
          <Route path="*" element={<Navigate replace to="/signin" />} />
        </>
      )}
    </Routes>
  );
}
