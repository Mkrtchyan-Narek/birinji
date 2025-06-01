import React from "react";
import Header from "../Header.jsx";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  addDoc,
  query, 
  where, 
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase.js";
import {
  getSnackbar,
  getUser,
  setSnackbar,
} from "../../store/slices/userReducer.js";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ThemeProvider,
  CssBaseline,
  createTheme,
  Tooltip,
  IconButton
} from "@mui/material";
import MySnackbar from "../mySnackbar.jsx";
import Paper from "@mui/material/Paper";
import { LinearProgress } from "@mui/material";
import Draggable from "react-draggable";
import Container from "@mui/material/Container";
import { Navigate } from "react-router-dom";
import Menu from "./Menu";

export default function Chat() {
  
    const theme = createTheme();
  const photoCardStyle = {
    boxShadow: "0 4px 8px 0 rgba(36, 2, 2, 0.2)",
    transition: "0.3s",
    width: "105px",
    height: "180px",
    borderRadius: "20px",
    backgroundColor: "white",
    position: "relative"
  };
  
  const photoCardHoverStyle = {
    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)"
  };
  
  const imgStyle = {
    width: "105px",
    height: "130px",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px"
  };
  
  const profileCardInfoStyle = {
    textAlign: "center"
  };
  const userInfo = useSelector(getUser);
  const [score1, setScore1] = React.useState(0);
  const [score2, setScore2] = React.useState(0);
  const [players, setPlayers] = React.useState([]);
  const user = useSelector(getUser);
  const [email, setEmail] = React.useState(user?.email);
  const [nickname, setNickname] = React.useState(user?.nickname);
  const [avatar, setAvatar] = React.useState("");
  const [leftCards, setLeftCards] = React.useState(36);
  const [playedCards, setplayedCards] = React.useState([]);
  const [deckId, setDeckId] = React.useState(null);
  const [me, setMe] = React.useState(0);
  const [cards, setCards] = React.useState([[], []]);
  const [turn, setTurn] = React.useState(0);
  const [heartsDisabled, setHeartsDisabled] = React.useState(true);
  const [spadesDisabled, setSpadesDisabled] = React.useState(true);
  const [clubsDisabled, setClubsDisabled] = React.useState(true);
  const [diamondsDisabled, setDiamondsDisabled] = React.useState(true);
  const [announcements, setAnnouncements] = React.useState([]);
  const [gameInfo, setGameInfo] = React.useState({players:[], open: true});
  const [dialogText, setDialogText] = React.useState("");
  const [quiting, setQuiting] = React.useState(false);
  const [playersData, setPlayersData] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [hasJustAnnounced, setHasJustAnnounced] = React.useState("none");
  const [actionsChanged, setActionsChanged] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [newActions, setNewActions] = React.useState([]);

  const snackbar = useSelector(getSnackbar);
  const dispatch = useDispatch();

  const quitGame = () => {
    let newPlayers = players;
    newPlayers.pop();
    updateDoc(doc(db, "games_2", gameInfo.id), {players: newPlayers, deck_id: deckId});
    updateDoc(doc(db, "users", user.uid), {currentGame: ""});
    setQuiting(true);
  }
  const start = async () => {
    try {
      const deckResponse = await fetch(
        "https://www.deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,6S,7S,8S,9S,0S,JS,QS,KS,AH,6H,7H,8H,9H,0H,JH,QH,KH,AD,6D,7D,8D,9D,0D,JD,QD,KD,AC,6C,7C,8C,9C,0C,JC,QC,KC,"
      );
      const deckData = await deckResponse.json();
      setDeckId(deckData.deck_id);
      return deckData.deck_id;
    } catch (error) {
      console.error("Error initializing game:", error);
    }
  };
  
  const drawBase = async (deck_id, players) => {
    let newCards = [];
    for(var i = 0; i < 2; i++) {
      const drawResponse = await fetch(
        `https://www.deckofcardsapi.com/api/deck/${deck_id}/draw/?count=5`
      );
      const drawData = await drawResponse.json();
      
      const resp = await fetch(
        `https://www.deckofcardsapi.com/api/deck/${deck_id}/pile/player${i}/add/?cards=${drawData.cards
        .map((card) => card.code)
        .join(",")}`
      );
      const log = await resp.json();
      newCards[i] = drawData.cards;
    }
    setCards(newCards);
    return JSON.stringify(newCards);
  }

  async function createGame() {
    const gameData = {
      combinations: "[]",
      count_1: 0,
      count_2: 0,
      open: true,
      played_cards: "[]",
      players: [],
      turn: 0,
      left_cards: 36,
      changed: false,
      actions: "[]"
    };
    const game = await addDoc(collection(db, "games_2"), gameData);
    const ids = [game.id];
    updateDoc(doc(db, "games_2", "openGames"), {ids});
    return [game.id, gameData];
  }
  
  React.useEffect(() => {
    (async () => {
      if(players.length==0)
        return;
      
      let players_data = [];
      for(var i = 0; i < 2; i++) {
        players_data[i] = (await getDoc(doc(db, "users", players[i]))).data();
      }
      setPlayersData(players_data);
    })();
  }, [gameInfo.open, gameInfo.changed, gameInfo.players.filter(x => x === "bot").length]);

  const handleKeyDown = async (event) => {
    if(gameInfo.open)
      return;
    if (event.code === 'ControlRight')    
      setMenuOpen(!menuOpen);
    else if(gameInfo.left_cards == 26 && playedCards.length == 0 && getHandValue(cards[me].map(card => card.code[0])) == 0 && event.code == "KeyX") {
      var newDoc ={changed: !gameInfo.changed};
      newDoc.winner = me%2 == 0 ? 1 : 0;
      newDoc.cards = JSON.stringify([[], []]);
      newDoc.played_cards = JSON.stringify([]);
      newDoc.left_cards = 0;
      updateDoc(doc(db, "games_2", gameInfo.id), newDoc);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  React.useEffect(() => {
    const handleKeyDown = async (event) => {
      if(gameInfo.open)
        return;
      if (event.code === 'ControlRight')    
        setMenuOpen(!menuOpen);
      else if(gameInfo.left_cards == 26 && playedCards.length == 0 && getHandValue(cards[me].map(card => card.code[0])) == 0 && event.code == "KeyX") {
        var newDoc ={changed: !gameInfo.changed};
        newDoc.winner = me%2 == 0 ? 1 : 0;
        newDoc.cards = JSON.stringify([[], []]);
        newDoc.played_cards = JSON.stringify([]);
        newDoc.left_cards = 0;
        updateDoc(doc(db, "games_2", gameInfo.id), newDoc);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  React.useEffect(() => { 
    newActions.filter(action => action.new).forEach((action, i) => {
      setTimeout(() => {
        dispatch(
          setSnackbar({
          show: true,
          message: action.type == "request" ? `${playersData[action.player].nickname} requested ${action.value}` : action.receivers.length != 1 ? `hint from ${playersData[action.player].nickname}: ${action.value}` : `hint: ${action.value}` ,
          type: "info",
          sx: {
            position: "fixed",
            top: "-20%",
            left: "0%",
            transform: "translate(25%, 0%)"
          }
          })
        );
      }, i*1000);
    });
    setNewActions(prevActions => prevActions.map(({new: _new, ...rest}) => rest));
  }, [actionsChanged])

  React.useEffect(() => {
    (async function asyncFunc() {
      let currentGame = (await getDoc(doc(db, "users", user.uid))).data().current_game;
      let game="none", gameData;
      if(currentGame) {
        let currentGameData = (await getDoc(doc(db, "games_2", currentGame))).data();
        
        if(currentGameData && (currentGameData?.open == true || JSON.parse(currentGameData?.cards).some(x => x.length > 0))) {
          let newMe = currentGameData.players.includes(user.uid) ? currentGameData.players.findIndex(player => player == user.uid) : currentGameData.players.findIndex(player => player == "bot"); 
          let newCards = currentGameData.cards ? JSON.parse(currentGameData.cards) : "[]";
          game = currentGame;
          gameData = currentGameData.players.includes(user.uid) ? currentGameData : {...currentGameData, players: currentGameData.players.map((val, i) => i == currentGameData.players.indexOf("bot") ? user.uid : val)};
          setCards(newCards);
          setMe(newMe);
        }
      }    
      let newDoc={};
      let openGames = (await getDoc(doc(db, "games_2", "openGames"))).data().ids;
      if(!openGames.length && game == "none") {
        const res = await createGame();
        [game, gameData] = [...res];
        openGames = [game];
      } else if(game == "none") {
        game = openGames[0];
        gameData = (await getDoc(doc(db, "games_2", game))).data();
      }

      const q = query(collection(db, "games_2"), where("open", "==", false));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach((currentDoc) => {
        if(!JSON.parse(currentDoc.data().cards).some(x => x.length > 0) && currentDoc.data().left_cards == 0) {
          deleteDoc(doc(db, "games_2", currentDoc.id));
        }
      });

      updateDoc(doc(db, "users", user.uid), {current_game: game});
      setGameInfo({...gameData, id: game});

      if(gameData.players.length != 2) {
        console.log("a");
        
        setMe(gameData.players.length);
      }
      const currentDeckId = gameData.deck_id ? gameData.deck_id : await start();
      setDeckId(currentDeckId);
      let newPlayers = gameData.players.includes(user.uid) ? gameData.players : gameData.players.length < 2 ? [...gameData.players, user.uid] : gameData.players.map((val, i) => i == gameData.players.indexOf("bot") ? user.uid : val);
      newDoc={players: newPlayers, deck_id: currentDeckId}
      setPlayers(newDoc.players);
      console.log(me);
      
      if(gameData.players.filter(player => player != user.uid).length == 1 && gameData.open == true) {
        setGameInfo({...gameData, id: game});
        const newIds = openGames.filter(id => id != game);
        updateDoc(doc(db, "games_2", "openGames"), {ids: [...newIds]});
        newDoc.open=false;
        newDoc.left_cards = 26;
        newDoc.cards = await drawBase(currentDeckId, game, newDoc.players);
      }
      
      updateDoc(doc(db, "games_2", game), newDoc);
      const unsub = onSnapshot(doc(db, "games_2", game),async (snapshot) => {
        const gameInfoNew = await snapshot.data();
        let me = gameInfoNew?.players.indexOf(user.uid);
        setPlayers(gameInfoNew?.players);
        if(gameInfoNew?.combinations)
          setAnnouncements(JSON.parse(gameInfoNew.combinations));
        setScore1(gameInfoNew?.count_1);
        setScore2(gameInfoNew?.count_2);
        if(gameInfoNew?.cards) {
          setCards(JSON.parse(gameInfoNew.cards));
          const duos = [['QS', 'KS'], ['QH', 'KH'], ['QD', 'KD'], ['QC', 'KC']];
          const cardCodes = new Set(JSON.parse(gameInfoNew?.cards)[me].map(card => card.code));
          const [s, h, d, c] = duos.map(([card1, card2]) => (cardCodes.has(card1) && cardCodes.has(card2)));
          setHeartsDisabled(announcements.some(announcement => announcement.suit == "H") ? true : !h);
          setSpadesDisabled(announcements.some(announcement => announcement.suit == "S") ? true : !s);
          setClubsDisabled(announcements.some(announcement => announcement.suit == "C") ? true : !c); 
          setDiamondsDisabled(announcements.some(announcement => announcement.suit == "D") ? true : !d);
        }
        if(gameInfoNew?.played_cards)
          setplayedCards(JSON.parse(gameInfoNew.played_cards));
        
        if(gameInfoNew?.winner == 0 || gameInfoNew?.winner == 1) {
          setOpen(true);
          setDialogText("The other team left.");
        }
        else if(gameInfoNew?.left_cards == 0 && !JSON.parse(gameInfoNew?.cards).some(arr => arr.length != 0)) {
          let winTeam = gameInfoNew.count_1 > gameInfoNew.count_2 ? 0 : 1;
          let myTeam = me % 2;
          if(gameInfoNew.count_1 == gameInfoNew.count_2) {
            setDialogText(`It's a tie. The score is ${gameInfoNew.count_1}:${gameInfoNew.count_2}`);
          } else if(winTeam == myTeam) {
            setDialogText(`You've won! The score is ${winTeam == 0 ? gameInfoNew.count_1 : gameInfoNew.count_2}:${winTeam == 1 ? gameInfoNew.count_1 : gameInfoNew.count_2}`);
          } else {
            setDialogText(`You've lost... The score is ${winTeam == 1 ? gameInfoNew.count_1 : gameInfoNew.count_2}:${winTeam == 0 ? gameInfoNew.count_1 : gameInfoNew.count_2}`);
          }
          setOpen(true);
        }
        setTurn(gameInfoNew?.turn);
        setLeftCards(gameInfoNew?.left_cards);
        
        if (gameInfoNew?.actions) {
          const parsedActions = JSON.parse(gameInfoNew.actions);
          const me = gameInfoNew.players.indexOf(auth.currentUser.uid);
        
          setNewActions(prevNewActions => {
            const isSameAction = (a, b) => JSON.stringify(a) === JSON.stringify(b);
            const newHints = parsedActions.filter(hint => {
              return hint.receivers.includes(me);
            }).map(hint => !prevNewActions.some(existing => isSameAction(existing, hint)) ? {...hint, new: true} : {...hint, new: false});
            
        
            if (newHints.length > 0) {
              setActionsChanged(prev => !prev);
              return newHints;
            }
        
            return prevNewActions;
          });
        }
        setGameInfo({...gameInfoNew, id: game});
      });
    })();   
    (async function aF() {
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      setAvatar(docSnap.data()?.avatar);
    })();
    onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (
        email !== docSnap.data()?.email ||
        nickname !== docSnap.data()?.nickname ||
        avatar !== docSnap.data()?.avatar
      ) {
        setAvatar(docSnap.data()?.avatar);
        setEmail(docSnap.data()?.email);
        setNickname(docSnap.data()?.nickname);
      }
    });   
  }, []);

  React.useEffect(() => {
    if(announcements[announcements.length-1]) {
      let value = 0, name;
      switch(announcements.length) {
        case 1:
          value = 40;
          name = "Birinji";
          break;
        case 2:
          value = 30;
          name = "Ikinji";
          break;
        case 3: 
          value = 20;
          name = "Ujnji";
          break;
        case 4:
          value = 10;
          name = "Dortnji";
          break;
      }

      if(announcements[announcements.length-1].player == me) {
        let newCount = {};
        if(me % 2 == 0)
          newCount.count_1 = score1+value;
        else  
          newCount.count_2 = score2+value;
        updateDoc(doc(db, "games_2", gameInfo.id), newCount);
      }

      dispatch(
        setSnackbar({
        show: true,
        message: `${playersData[announcements[announcements.length-1].player].nickname.length > 10 ? playersData[announcements[announcements.length-1].player].nickname.substring(0, 10) + "..." : playersData[announcements[announcements.length-1].player].nickname}: ${name} ${announcements[announcements.length-1].suit}`,
        type: "success",
        sx: {
          position: "fixed",
          top: "-20%",
          left: "0%",
          transform: "translate(25%, 0%)"
        }
        })
      );
    }
  }, [announcements.length]);

  if(quiting) 
    return <Navigate replace to={`/home`} />;

  if(gameInfo.open) {
    return (
      <ThemeProvider theme={theme}>
        <LinearProgress />
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
            <Box>
            <Typography
              variant="h6"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
              }}
            >
              Looking for players...
            </Typography>
            <Typography
              variant="h8"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
              }}
            >
              Birinji is a trick-taking card game played with four players, divided into two teams. Each player starts with five cards, and the goal is to accumulate the most points by winning tricks and forming special combinations. In each round, players place one card on the table, and the team whose player placed the highest-value card wins the trick and takes all four cards. After each round, players draw one card from the deck. The game continues until the deck is empty and all cards are played. Card values are as follows: 8, 9, and 10 are worth 0 points; J is 2, Q is 3, K is 4, A is 11, 7 is 10, and 6 is 30. Special combinations consist of a Queen and King of the same suit (e.g., both Hearts or both Spades). These combinations must be announced to count and can only be declared when it is the player's turn to play or when there are no cards on the table. To announce, the player must show both cards and say the correct phrase: "Birinji" for the first combination (40 points), "Ikinji" for the second (30 points), "Ujnji" for the third (20 points), and "Dortnji" for the fourth (10 points). The first announced combination (Birinji) grants power to all cards of its suit, meaning that any card of that suit is stronger than a 6. The last round grants an extra 10 points to the winning team. At the end of the game, points are counted, and the team with the highest score wins.
            </Typography>
            <br />
            <Button 
                onClick={quitGame}
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                style={{
                  borderRadius: "20px",
                  backgroundColor: "white",
                  width: "12%"
                }}>
            <Typography
              variant="h9"
              noWrap
              style={{
                whiteSpace: "normal", 
                overflow: "visible",
                color: "#2fb5be"
              }}
            >
              Leave game
            </Typography>
            </Button>
            </Box>
          </Container>
        </ThemeProvider>
    );
  }

  const angleStep = playedCards.length > 1 ? 40 / (playedCards.length - 1) : 0; 
  const angleStepForPile0 = cards[me].length > 1 ? 50 / (cards[me].length - 1) : 0; 
  const angleStepForPile2 = cards[((me + 1) % 2)].length > 1 ? 50 / (cards[((me + 1) % 2)].length - 1) : 0;
  const startAngle = -20; 

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

  const handleClose = () => {
    setOpen(false);
    setDialogText("");
    setQuiting(true);
  };

function getBiggestCard(currentCards, obj=false) {
    const cardValues = { '6': 30, '7': 10, '8': 0, '9': 0.1, '0': 0.2, 'J': 2, 'Q': 3, 'K': 4, 'A': 11 };
    
    if(obj) {
      currentCards = currentCards.map(card => card.code[0]);
    }

    let maxCard = currentCards[0];
    let maxIndex = 0;
    let maxValue = cardValues[maxCard];
    
    for (let i = 1; i < currentCards.length; i++) {
        if (cardValues[currentCards[i]] > maxValue) {
            maxCard = currentCards[i];
            maxIndex = i;
            maxValue = cardValues[currentCards[i]];
        }
    }

    if(maxValue < 1) {
      maxValue = 0;
    }
    
    return { maxCard, maxIndex, maxValue };
}

function getSmallestCard(currentCards, obj = false) {
  const cardValues = { '6': 30, '7': 10, '8': 0, '9': 0.1, '0': 0.2, 'J': 2, 'Q': 3, 'K': 4, 'A': 11 };
  if(obj) {
    currentCards = currentCards.map(card => card.code[0]);
  }
  let minCard = currentCards[0];
  let minIndex = 0;
  let minValue = cardValues[minCard];
  
  for (let i = 1; i < currentCards.length; i++) {
      if (cardValues[currentCards[i]] < minValue) {
          minCard = currentCards[i];
          minIndex = i;
          minValue = cardValues[currentCards[i]];
      }
  }

  if(minValue < 1) {
    minValue = 0;
  }
  
  return { minCard, minIndex, minValue };
}

function getHandValue(currentCards) {
  const cardValues = { '6': 30, '7': 10, '8': 0, '9': 0, '0': 0, 'J': 2, 'Q': 3, 'K': 4, 'A': 11 };
  let sum = 0;
  for (let i = 0; i < currentCards.length; i++) {
    sum += cardValues[currentCards[i]];
  }
  return sum;
}

function PlayerCard({id, index, angle}) {
  let playerInfo = playersData.length > id ? playersData[id] : {nickname: "Loading..."};
  return (
    <div style={{
      width: "105px",
        height: "160px",
        position: "absolute",
        left: `${index * 5}px`,
        transform: `rotate(${angle}deg)`,
        zIndex: index,
        top: "-15px",
        borderRadius: "7px"
    }}>
      <div className="photo-card" 
        style={{ ...photoCardStyle, 
          border: (turn == id) ? "3px solid yellow" : "none",
          borderRadius: (turn == id) ?  "7px" : "0", }} 
      >
        <Tooltip>
          <IconButton 
            sx={{ p: 0 }} 
            onClick={() => window.open(playerInfo.avatar, "_blank")}>
            <Avatar
              style={imgStyle}
              alt={playerInfo.nickname}
              src={playerInfo.avatar}
            />
          </IconButton>
        </Tooltip>
        <div style={profileCardInfoStyle}>
        <h4 style={{marginTop: "6px"}}>{playerInfo.nickname.length > 10 ? playerInfo.nickname.substring(0, 10) + "..." : playerInfo.nickname}</h4>
        </div>
      </div>
    </div>
  );
}

function leave() {
  setQuiting(true);
  const newPlayers = players.map(playerId => (playerId == auth.currentUser.uid) ? "bot" : playerId);
  var newDoc ={players: newPlayers, changed: !gameInfo.changed};
  newDoc.winner = me%2 == 0 ? 1 : 0;
  newDoc.cards = JSON.stringify([[], []]);
  newDoc.played_cards = JSON.stringify([]);
  newDoc.left_cards = 0;
  updateDoc(doc(db, "games_2", gameInfo.id), newDoc);
}
  
  return (
    <>
      {menuOpen ? <Menu setOpen={setMenuOpen} actions={JSON.parse(gameInfo.actions)} me={me} gameId={gameInfo.id}></Menu> : ""}
    <div>
      <Header
        settings={["Leave"]}
        leave={leave}
        headerName={"Game"}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle>Game over!</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Close</Button>
        </DialogActions>
      </Dialog>
      <div style={{ 
  marginTop: "20px", 
  textAlign: "center", 
  position: "relative", 
  height: "300px"
}}>
  <div style={{ position: "absolute", left: "45%", transform: "translateX(-50%)" }}>
  {cards[((me + 1) % 2)].map((card, index) => {
  const angle = startAngle + index * angleStepForPile2; 
  return index === cards[((me + 1) % 2)].length - 1 ? (
    <PlayerCard key={index} id={((me + 1) % 2)} index={index} angle={angle}></PlayerCard>
  ) : (
    <img
      key={index}
      src="https://www.deckofcardsapi.com/static/img/back.png"
      style={{
        width: "100px",
        height: "160px",
        position: "absolute",
        left: `${index * 15}px`,
        transform: `rotate(${angle}deg)`,
        zIndex: index,
        border: (turn == (me + 2) % 4) ? "3px solid yellow" : "none",
        borderRadius: (turn == (me + 2) % 4) ?  "7px" : "0",
      }}
      alt="Playing Card"
    />
  )
})}
  </div>

  <div style={{ position: "absolute", left: "40.5%", top: "140%", transform: "translateX(-100%)" }}>
  {cards[me].map((card, index) => {
  const angle = startAngle + index * angleStepForPile0; 
  return (
    <img 
      key={index} 
      src={card.image}
      onClick={(turn == me) && playedCards.length != 2 && (hasJustAnnounced != "none" ? (hasJustAnnounced == card.code[1] && (card.code[0] == "Q" || card.code[0] == "K")) : true) ? async () => { 
        if(hasJustAnnounced != "none")
          setHasJustAnnounced("none");
        let newCards = [...cards];
        newCards[me] = [...cards[me].filter(currentCard => currentCard.code != card.code)];
        let newPlayedCards = [...playedCards, {...card, player: me}];
        const duos = [['QS', 'KS'], ['QH', 'KH'], ['QD', 'KD'], ['QC', 'KC']];
        const cardCodes = new Set(newCards[me].map(card => card.code));
        const [s, h, d, c] = duos.map(([card1, card2]) => cardCodes.has(card1) && cardCodes.has(card2));
        setHeartsDisabled(announcements.some(announcement => announcement.suit == "H") ? true : !h);
        setSpadesDisabled(announcements.some(announcement => announcement.suit == "S") ? true : !s);
        setClubsDisabled(announcements.some(announcement => announcement.suit == "C") ? true : !c); 
        setDiamondsDisabled(announcements.some(announcement => announcement.suit == "D") ? true : !d);
        let next = (me+1)%2;
        let tOut = false;
        setCards(newCards);
        setplayedCards(newPlayedCards);
        updateDoc(doc(db, "games_2", gameInfo.id), {turn: next, cards: JSON.stringify(newCards), played_cards: JSON.stringify(newPlayedCards)});
        if(playedCards.length == 1) {
          tOut = true;
          setTimeout(async () => {
            let suit = playedCards[0].code[1];
          let ofThisSuit;
          ofThisSuit = [...playedCards, card].filter((card) => card.code[1] == suit).map(card => card.code[0]);
          if(announcements[0] && suit != announcements[0].suit){
              let trumps = [...playedCards, card].filter(card => card.code[1] == announcements[0].suit).map(card => card.code[0]);
              if(trumps.length > 0) {
                suit = announcements[0].suit;
                ofThisSuit = trumps;
              }
          }
          let biggestCardInfo = getBiggestCard(ofThisSuit);
          let hand = getHandValue([...playedCards, card].map(card => card.code[0]));
          hand += cards[0].length == 0 ? 10 : 0;
          let winners = [...playedCards, {...card, player: me}].filter(card => card.code[1] == suit && card.code[0] == biggestCardInfo.maxCard);
          let windex = winners[0].player;
          setTurn(windex);
          next = windex;
          if(windex % 2 == 0) {
            setScore1(score1+hand);
            updateDoc(doc(db, "games_2", gameInfo.id), {count_1: score1+hand});
          } else {
            setScore2(score2+hand);
            updateDoc(doc(db, "games_2", gameInfo.id), {count_2: score2+hand});
          }
          setplayedCards([]);
          newPlayedCards = [];
          var newDocForHand = {turn: windex, played_cards: "[]"};
          if(leftCards != 0) {
            for(let i = 0; i < 2; i++) {
              const drawResponse = await fetch(
                `https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`
              );
              const drawData = await drawResponse.json();
              const resp = await fetch(
                `https://www.deckofcardsapi.com/api/deck/${deckId}/pile/player${i}/add/?cards=${drawData.cards[0].code}`
              );
              const log = await resp.json();
              newCards[i].push(drawData.cards[0]);
              if(i==1) {
                newDocForHand.left_cards = log.remaining;
                setLeftCards(log.remaining);
                newDocForHand.cards = JSON.stringify(newCards);
              }
            }
          }
          updateDoc(doc(db, "games_2", gameInfo.id), newDocForHand);
          }, 1000);
        }
      } : () => {}}
      style={{ 
        width: "110px", height: "170px", 
        position: "absolute", 
        transform: `rotate(${angle}deg)`, 
        left: `${index * 40}px`,
        zIndex: index,
        border: (turn == me) ? "3px solid yellow" : "none",
        borderRadius: (turn == me) ?  "7px" : "0",
      }} 
    />
  );
})}
  </div>

  <div style={{ 
    position: "absolute", 
    left: "83%", 
    top: "180%", 
    transform: "translateY(-55%)",
    width: "100%",
            minHeight: 100,
            maxWidth: 200,
            border: "1px inset white",
            backgroundColor: "#2fb5be",
            borderRadius: "20px",
            color: "white", }}>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            marginTop: "15px",
          }}
        >
          <Typography variant="h6" style={me%2!=0?{color: "#1a4e52"}:{color: "white"}} noWrap>
            {`Team 1: ${score1}`}
          </Typography>
          <Typography variant="h6" style={me%2==0?{color: "#1a4e52"}:{color: "white"}} noWrap>
          {`Team 2: ${score2}`}
          </Typography>
        </div>
  </div>
  <div style={{ 
    position: "absolute", 
    left: "5%", 
    top: "177%", 
    transform: "translateY(-55%)",
    width: "100%",
            minHeight: 100,
            maxWidth: 200,
            border: "1px inset white",
            backgroundColor: "#2fb5be",
            borderRadius: "20px",
            color: "white",
            padding: "5px", }}>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
          }}
        >
          <ListItem disablePadding>
          <ListItemButton onClick={() => {
            if((playedCards.length == 0 || turn == me) && !announcements.map(announcement => announcement.suit).includes("H")) {if(announcements.length==0 && turn == me) {
              setHasJustAnnounced("H");
            }
              setAnnouncements([...announcements, {player: me, suit: "H"}]);
              updateDoc(doc(db, "games_2", gameInfo.id), {combinations: JSON.stringify([...announcements, {player: me, suit: "H"}])});
              setHeartsDisabled(true);
            }
          }} disabled={heartsDisabled || (!heartsDisabled ? announcements.map(announcement => announcement.suit).includes("H") : false)}>
              <ListItemIcon>
                <Avatar
                  style={{ width: "40px", height: "40px" }}
                  alt={"H"}
                  src={"https://cdn.creazilla.com/cliparts/3158304/heart-clipart-md.png"}
                />
              </ListItemIcon>
            <ListItemText primary={"Hearts"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            if((playedCards.length == 0 || turn == me) && !announcements.map(announcement => announcement.suit).includes("S")) {if(announcements.length==0 && turn == me) {
              setHasJustAnnounced("S");
            }
              setAnnouncements([...announcements, {player: me, suit: "S"}]);
              updateDoc(doc(db, "games_2", gameInfo.id), {combinations: JSON.stringify([...announcements, {player: me, suit: "S"}])});
              setSpadesDisabled(true);
            }
          }} disabled={spadesDisabled || (!spadesDisabled ? announcements.map(announcement => announcement.suit).includes("S") : false)}>
              <ListItemIcon>
                <Avatar
                  style={{ width: "40px", height: "40px" }}
                  alt={"S"}
                  src={"https://static-00.iconduck.com/assets.00/spades-icon-1793x2048-pazqul4w.png"}
                />
              </ListItemIcon>
            <ListItemText primary={"Spades"} />
          </ListItemButton>
        </ListItem>
        </div>
  </div>
  <div style={{ 
    position: "absolute", 
    left: "5%", 
    top: "27%", 
    transform: "translateY(-55%)",
    width: "100%",
            minHeight: 100,
            maxWidth: 200,
            border: "1px inset white",
            backgroundColor: "#2fb5be",
            borderRadius: "20px",
            color: "white",
            padding: "5px", }}>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
          }}
        >
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            if((playedCards.length == 0 || turn == me) && !announcements.map(announcement => announcement.suit).includes("D")) {if(announcements.length==0 && turn == me) {
              setHasJustAnnounced("D");
            }
              setAnnouncements([...announcements, {player: me, suit: "D"}]);
              updateDoc(doc(db, "games_2", gameInfo.id), {combinations: JSON.stringify([...announcements, {player: me, suit: "D"}])});
              setDiamondsDisabled(true);
            }
          }} disabled={diamondsDisabled || (!diamondsDisabled ? announcements.map(announcement => announcement.suit).includes("D") : false)}>
              <ListItemIcon>
                <Avatar
                  style={{ width: "40px", height: "40px" }}
                  alt={"D"}
                  src={"https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/SuitDiamonds.svg/800px-SuitDiamonds.svg.png"}
                />
              </ListItemIcon>
            <ListItemText  primary={"Diamonds"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            if((playedCards.length == 0 || turn == me) && !announcements.map(announcement => announcement.suit).includes("C")) {
              if(announcements.length==0 && turn == me) {
                setHasJustAnnounced("C");
              }
              setAnnouncements([...announcements, {player: me, suit: "C"}]);
              updateDoc(doc(db, "games_2", gameInfo.id), {combinations: JSON.stringify([...announcements, {player: me, suit: "C"}])});
              setClubsDisabled(true);
            }
          }} disabled={clubsDisabled || (!clubsDisabled ? announcements.map(announcement => announcement.suit).includes("C") : false)}>
              <ListItemIcon>
                <Avatar
                  style={{ width: "40px", height: "40px" }}
                  alt={"C"}
                  src={"https://cdn.creazilla.com/icons/3208104/cards-club-icon-md.png"}
                />
              </ListItemIcon>
            <ListItemText primary={"Clubs"} />
          </ListItemButton>
        </ListItem>
        </div>
  </div>
  <div style={{ position: "absolute", right: "15%", top: "3%", transform: "translateY(-55%)" }}>
  {Array.from({ length: leftCards }).map((_, index) => (
  <img 
    key={index} 
    src="https://www.deckofcardsapi.com/static/img/back.png" 
    style={{ 
      width: "100px",
      height: "160px",
      position: "absolute",
      left: `${index*2}px`,
      zIndex: index 
    }} 
  />
))}
  </div>
  <div style={{ position: "absolute", left: "46%", top: "75%", transform: "translateY(-55%)" }}>
  {playedCards.map((card, index) => {
  const angle = startAngle + index * angleStep; 
  return (
    <img 
      key={index} 
      src={card.image}
      style={{ 
        width: "100px", height: "160px", 
        position: "absolute", 
        transform: `rotate(${angle}deg)`, 
        zIndex: index
      }} 
    />
  );
})}
  </div>
</div>


      {snackbar.show ? (
        <MySnackbar message={snackbar.message} type={snackbar.type} />
      ) : null}
    </div>
    </>
  );
}
