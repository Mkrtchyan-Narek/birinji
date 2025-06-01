import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { app, auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  getSnackbar,
  setImgLink,
  setLog,
  setSnackbar,
  setUser,
} from "../store/slices/userReducer";
import { useDispatch, useSelector } from "react-redux";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import MySnackbar from "./mySnackbar.jsx";

const theme = createTheme();

export default function SignUp() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [file, setFile] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [emailError, setEmailError] = React.useState(null);
  const [passwordError, setPasswordError] = React.useState(null);
  const [nickError, setNickError] = React.useState(null);
  const [fileName, setFileName] = React.useState("Profile picture");
  const dispatch = useDispatch();
  const snackbar = useSelector(getSnackbar);
  let uid = "";

  const validateEmail = () => {
    if (email.length === 0) {
      setEmailError("Required");
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError(null);
    }
  };
  const validatePassword = () => {
    if (password.length === 0) {
      setPasswordError("Required");
    } else if (password.length < 6) {
      setPasswordError("Password must contain at least 6 characters");
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must contain at least one uppercase letter");
    } else if (!/[a-z]/.test(password)) {
      setPasswordError("Password must contain at least one lowercase letter");
    } else if (!/\d/.test(password)) {
      setPasswordError("Password must contain at least one number");
    } else {
      setPasswordError(null);
    }
  };
  const validateNick = () => {
    if (nickname.length === 0) {
      setNickError("Required");
    } else {
      setNickError(null);
    }
  };

  const handleChange = (event) => {
    if (event.target.files[0] && event.target.files[0].type.includes("image")) {
      setFile(event.target.files[0]);
      setFileName(event.target.files[0].name);
    }
  };

  function handleUpload() {
    const storageRef = ref(storage, `/avatars/${uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {},
      (err) => console.log(err),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
          dispatch(setImgLink(url));
          await updateDoc(doc(db, "users", uid), {
            avatar: url,
          });
        });
      }
    );
  }
  async function setUserData(id) {
    await setDoc(doc(db, "users", id), {
      email,
      password,
      nickname
    });
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    validatePassword();
    validateEmail();
    validateNick();
    if (emailError || passwordError || nickError) {
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        uid = user.uid;
        setUserData(uid);
        handleUpload();
        dispatch(setUser(user));
        dispatch(setLog(true));
        dispatch(
          setSnackbar({
            show: true,
            message: "Signed up successfully!",
            type: "success",
          })
        );
      })
      .catch((error) => {
        const errorCode = error.code;        
        if (errorCode === "auth/email-already-in-use") {
          dispatch(
            setSnackbar({
              show: true,
              message: "Email already in use!",
              type: "error",
            })
          );
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
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="standard"
                    autoComplete="given-name"
                    name="nickname"
                    required
                    fullWidth
                    id="nickname"
                    label="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    error={!!nickError}
                    helperText={nickError}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="standard"
                    required
                    fullWidth
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    error={!!emailError}
                    helperText={emailError}
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="standard"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    error={!!passwordError}
                    helperText={passwordError}
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <div>
                    <Button
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      style={{
                        borderRadius: "20px",
                        backgroundColor: "#2fb5be",
                      }}
                    >
                      <label>
                        <input
                          type="file"
                          onChange={handleChange}
                          accept="image/*"
                        />
                        {fileName}
                      </label>
                    </Button>
                  </div>
                </Grid>
              </Grid>
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
                Sign Up
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="outlined"
                sx={{ mt: 3, mb: 2 }}
                href="./signin"
                style={{
                  borderRadius: "20px",
                  color: "grey",
                  borderColor: "grey",
                }}
              >
                Sign In
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
