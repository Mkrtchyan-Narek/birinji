import { useSelector } from "react-redux";
import MySnackbar from "./mySnackbar.jsx";
import { auth, db } from "../firebase.js";
import { getProfileValue, getSnackbar } from "../store/slices/userReducer.js";
import * as React from "react";
import Container from "@mui/material/Container";
import { Navigate } from "react-router-dom";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Avatar,
  Box,
  Typography,
  Image
} from "@mui/material";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Header from "./Header.jsx";
import Paper from "@mui/material/Paper";
import { Dialog } from "@mui/material";
import Draggable from "react-draggable";

export default function Home() {
  const snackbar = useSelector(getSnackbar);
  const theme = createTheme();

  const [navigateTo, setNavigateTo] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.backgroundColor = "white";
  }, []);

  const handleKeyDown = async (event) => {
    if (event.code === 'KeyI' && !open)    
      setOpen(true);
    };
  
  document.addEventListener('keydown', handleKeyDown);
  if (navigateTo) {
    return <Navigate replace to={`/${navigateTo.toLowerCase()}`} />;
  }

  function PaperComponent(props) {
    return (
      <Draggable
        handle="#draggable-dialog-title"
        cancel={'[class*="MuiDialogContent-root"]'}
      >
        <Paper {...props} />
      </Draggable>
    );
  }

  try {
    return (
      <div>
        <Header
          settings={["Game 4P", "Game 2P", "Playground", "Settings", "Log out"]}
          headerName="Home"
          leave={()=>{}}
        />
        {open ? <Dialog
          open={open}
          PaperComponent={PaperComponent}
          onClick={() => setOpen(false)}
        >
          <div style={{padding: "10px"}}>
            <Typography
              variant="h6"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
              }}
            >
              There is a quick actions menu to help you communicate with other players. You can open and close it by pressing the right control button. The first group of buttons is for requests to your partner, like what you want them to play. For example, the \"?\" button is used to ask what to play, and the last button on the row is for trumps. These messages are shown to all players.\n\nThe second section is for sending messages only to your partner. However, to do that, you need to pass a small minigame. In the minigame, a white line moves across a bar, and you must press the space button to stop it exactly in the green area. If you succeed, the message is sent only to your teammate. If you fail, the message goes to everyone. The first four buttons in this section are for letting your partner know about the combinations you have. The other ones are for showing which trump cards you have.
            </Typography>
          </div>
        </Dialog> : ""}
        <ThemeProvider theme={theme}>
          <Container
            component="main"
            style={{
              color: "white",
              marginTop: "5%",
              width: "80%",
              backgroundColor: "#2fb5be",
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            <CssBaseline />
            <Box>
            <Typography
              variant="h6"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
              }}
            >
              Birinji is a trick-taking card game played with four players, divided into two teams. Each player starts with five cards, and the goal is to accumulate the most points by winning tricks and forming special combinations. In each round, players place one card on the table, and the team whose player placed the highest-value card wins the trick and takes all four cards. After each round, players draw one card from the deck. The game continues until the deck is empty and all cards are played. Card values are as follows: 8, 9, and 10 are worth 0 points; J is 2, Q is 3, K is 4, A is 11, 7 is 10, and 6 is 30. Special combinations consist of a Queen and King of the same suit (e.g., both Hearts or both Spades). These combinations must be announced to count and can only be declared when it is the player's turn to play or when there are no cards on the table. To announce, the player must show both cards and say the correct phrase: "Birinji" for the first combination (40 points), "Ikinji" for the second (30 points), "Ujnji" for the third (20 points), and "Dortnji" for the fourth (10 points). The first announced combination (Birinji) grants power to all cards of its suit, meaning that any card of that suit is stronger than a 6. The last round grants an extra 10 points to the winning team. At the end of the game, points are counted, and the team with the highest score wins. If you have all 0 point cards in the beginning, you can press the x key to stop the game<br /> Press the "I" key for quick action menu instructions.
            </Typography>
            </Box>
          </Container>
        </ThemeProvider>
        {snackbar.show ? (
          <MySnackbar message={snackbar.message} type={snackbar.type} />
        ) : null}
      </div>
    );
  } catch (err) {
    console.log(err);
  }
}
