import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase";
import {
  getSnackbar,
  setLog,
  setSnackbar,
  setUser,
} from "../store/slices/userReducer";
import { useDispatch, useSelector } from "react-redux";
import MySnackbar from "./mySnackbar.jsx";

const theme = createTheme();

export default function SignIn(props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState(null);
  const [passwordError, setPasswordError] = React.useState(null);
  const snackbar = useSelector(getSnackbar);
  const dispatch = useDispatch();

  const validateEmail = () => {
    if (email.length === 0) {
      setEmailError("Required");
    } else {
      setEmailError(null);
    }
  };
  const validatePassword = () => {
    if (password.length === 0) {
      setPasswordError("Required");
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    validatePassword();
    validateEmail();
    if (emailError || passwordError) {
      return;
    }
    const auth = getAuth(app);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
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
      })
      .catch((error) => {
        const errorCode = error.code;        
        switch (errorCode) {
          case "auth/invalid-login-credentials":
            dispatch(
              setSnackbar({
                show: true,
                message: "Email or password wrong!",
                type: "error",
              })
            );
            props.update();
            break;
          default:
        }
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
          maxWidth="xs"
          style={{
            width: "25%",
            backgroundColor: "white",
            borderRadius: "20px",
            paddingBottom: "40px",
            paddingLeft: "40px",
            paddingRight: "40px",
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
              <TextField
                variant="standard"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                autoComplete="email"
                autoFocus
              />
              <TextField
                variant="standard"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                autoComplete="current-password"
              />
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
                Sign In
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="outlined"
                sx={{ mt: 3, mb: 2 }}
                href="./signup"
                style={{
                  borderRadius: "20px",
                  color: "grey",
                  borderColor: "grey",
                }}
              >
                Sign Up
              </Button>
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
