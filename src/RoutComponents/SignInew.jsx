import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getAuth } from "firebase/auth";
import {
  getSnackbar,
  setLog,
  setSnackbar,
  setUser,
} from "../store/slices/userReducer";
import { useDispatch, useSelector } from "react-redux";
import { app, db } from "../firebase";
import { GoogleAuthProvider, linkWithCredential,
  signInWithPopup, getAdditionalUserInfo} from "firebase/auth";
import MySnackbar from "./mySnackbar.jsx";
import "./firebaseui.css"
import {
  doc,
  setDoc,
} from "firebase/firestore";

const theme = createTheme();

export default function SignIn(props) {
  const snackbar = useSelector(getSnackbar);
  const dispatch = useDispatch();


  const handleSubmit = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
  const auth = getAuth(app);
  auth.languageCode = auth.useDeviceLanguage();
  provider.setCustomParameters({
    'login_hint': 'user@example.com'
  });
      signInWithPopup(auth, provider)
  .then(async (result) => {
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    const info = await getAdditionalUserInfo(result);
    if(info.isNewUser) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        nickname: user.displayName,
        avatar: user.photoURL,
      });
    }
    dispatch(setUser(user));
    dispatch(setLog(true));
    props.update();
    dispatch(
      setSnackbar({
          show: true,
          message: "Signed in successfully!",
          type: "success",
      })
    );
    props.update();
    
    
    // IdP data available using getAdditionalUserInfo(result)
    // ...

    // const user = userCredential.user;
        

  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.log(credential);
    
    // ...
  });
  };
  React.useEffect(() => {
    document.body.style.backgroundColor = "#2fb5be";
  }, []);
  return (
    <div>
      <Typography variant="h1" style={{ color: "white", textAlign: "center" }}>
        Birinji
      </Typography>
      <ThemeProvider theme={theme}>
        <Container
          component="main"
          style={{
            width: "80%",
            backgroundColor: "white",
            borderRadius: "20px",
            paddingBottom: "40px",
          }}
        >
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                style={{
                  borderRadius: "20px",
                  backgroundColor: "#2fb5be",
                }}
              >
                <span class="firebaseui-idp-icon-wrapper">
                <img class="firebaseui-idp-icon" alt="" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{height: "30px", width: "30px"}}/>
                </span>
                <span class="firebaseui-idp-text firebaseui-idp-text-long" style={{fontSize:"20px"}}>Sign in with Google</span>
                <span class="firebaseui-idp-text firebaseui-idp-text-short" style={{fontSize:"20px"}}>Google</span>
              </Button>
            </Box>
            <Box>
            <Typography
              variant="h6"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
              }}
            >
              Birinji is a trick-taking card game played with four players, divided into two teams. Each player starts with five cards, and the goal is to accumulate the most points by winning tricks and forming special combinations. In each round, players place one card on the table, and the team whose player placed the highest-value card wins the trick and takes all four cards. After each round, players draw one card from the deck. The game continues until the deck is empty and all cards are played. Card values are as follows: 8, 9, and 10 are worth 0 points; J is 2, Q is 3, K is 4, A is 11, 7 is 10, and 6 is 30. Special combinations consist of a Queen and King of the same suit (e.g., both Hearts or both Spades). These combinations must be announced to count and can only be declared when it is the player's turn to play or when there are no cards on the table. To announce, the player must show both cards and say the correct phrase: "Birinji" for the first combination (40 points), "Ikinji" for the second (30 points), "Ujnji" for the third (20 points), and "Dortnji" for the fourth (10 points). The first announced combination (Birinji) grants power to all cards of its suit, meaning that any card of that suit is stronger than a 6. The last round grants an extra 10 points to the winning team. At the end of the game, points are counted, and the team with the highest score wins.
            </Typography>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
      {snackbar.show ? (
        <MySnackbar message={snackbar.message} type={snackbar.type} />
      ) : null}
    </div>
  );
}
