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
  const [players, setPlayers] = React.useState([auth.currentUser.uid, "bot", "bot", "bot"]);
  const user = useSelector(getUser);
  const [email, setEmail] = React.useState(user?.email);
  const [nickname, setNickname] = React.useState(user?.nickname);
  const [avatar, setAvatar] = React.useState("");
  const [leftCards, setLeftCards] = React.useState(16);
  const [playedCards, setplayedCards] = React.useState([]);
  const [deckId, setDeckId] = React.useState(null);
  const [me, setMe] = React.useState(0);
  const [cards, setCards] = React.useState([[], [], [], []]);
  const [turn, setTurn] = React.useState(0);
  const [heartsDisabled, setHeartsDisabled] = React.useState(true);
  const [spadesDisabled, setSpadesDisabled] = React.useState(true);
  const [clubsDisabled, setClubsDisabled] = React.useState(true);
  const [diamondsDisabled, setDiamondsDisabled] = React.useState(true);
  const [announcements, setAnnouncements] = React.useState([]);
  const [gameInfo, setGameInfo] = React.useState({players:[user.uid, "bot", "bot", "bot"], open: false});
  const [dialogText, setDialogText] = React.useState("");
  const [quiting, setQuiting] = React.useState(false);
  const [playersData, setPlayersData] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [hasJustAnnounced, setHasJustAnnounced] = React.useState("none");
  const [lastShownAnnouncement, setLastShownAnnouncement] = React.useState(null);


  const snackbar = useSelector(getSnackbar);
  const dispatch = useDispatch();

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
  
  const drawBase = async (deck_id) => {
    let newCards = [];
    for(var i = 0; i < 4; i++) {
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
    const duos = [['QS', 'KS'], ['QH', 'KH'], ['QD', 'KD'], ['QC', 'KC']];
    const cardCodes = new Set(newCards[me].map(card => card.code));
    const [s, h, d, c] = duos.map(([card1, card2]) => cardCodes.has(card1) && cardCodes.has(card2));
    setHeartsDisabled(announcements.some(announcement => announcement.suit == "H") ? true : !h);
    setSpadesDisabled(announcements.some(announcement => announcement.suit == "S") ? true : !s);
    setClubsDisabled(announcements.some(announcement => announcement.suit == "C") ? true : !c); 
    setDiamondsDisabled(announcements.some(announcement => announcement.suit == "D") ? true : !d);
    return newCards;
  }
  
  React.useEffect(() => {
    if(gameInfo.left_cards == 0 && !cards.some(arr => arr.length != 0)) {
      let winTeam = score1 > score2 ? 0 : 1;
      let myTeam = me % 2;
      if(score1 == score2) {
        setDialogText(`It's a tie. The score is ${score1}:${score2}`);
      } else if(winTeam == myTeam) {
        setDialogText(`You've won! The score is ${winTeam == 0 ? score1 : score2}:${winTeam == 1 ? score1 : score2}`);
      } else {
        setDialogText(`You've lost... The score is ${winTeam == 1 ? score1 : score2}:${winTeam == 0 ? score1 : score2}`);
      }
      setOpen(true);
    }
  }, [gameInfo]);

  React.useEffect(() => {
    (async () => {
      let players_data = [];
      for(var i = 0; i < 4; i++) {
        players_data[i] = (await getDoc(doc(db, "users", players[i]))).data();
      }
      setPlayersData(players_data);
    })();
  }, []);

  React.useEffect(() => {
    (async function asyncFunc() {
      let gameData = {};
      const currentDeckId = await start();
      setDeckId(currentDeckId);
      gameData.open=false;
      gameData.left_cards = 16;
      gameData.cards = await drawBase(currentDeckId);
      setGameInfo(oldInfo => ({...oldInfo, ...gameData}));
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
  const last = announcements[announcements.length - 1];
  if (!last || last === lastShownAnnouncement) return;

  let value = 0, name;
  switch (announcements.length) {
    case 1: value = 40; name = "Birinji"; break;
    case 2: value = 30; name = "Ikinji"; break;
    case 3: value = 20; name = "Ujnji"; break;
    case 4: value = 10; name = "Dortnji"; break;
  }

  if (last.player === me) {
    if (me % 2 === 0) setScore1(score1 + value);
    else setScore2(score2 + value);
  }

  dispatch(setSnackbar({
    show: true,
    message: `${playersData[last.player]?.nickname?.length > 10
      ? playersData[last.player].nickname.substring(0, 10) + "..."
      : playersData[last.player]?.nickname || "Player"}: ${name} ${last.suit}`,
    type: "success",
    sx: {
      position: "fixed",
      top: "-20%",
      left: "0%",
      transform: "translate(25%, 0%)"
    }
  }));

  setLastShownAnnouncement(last);
}, [announcements]);

  if(quiting) 
    return <Navigate replace to={`/home`} />;

  const angleStep = playedCards.length > 1 ? 40 / (playedCards.length - 1) : 0; 
  const angleStepForPile0 = cards[me].length > 1 ? 50 / (cards[me].length - 1) : 0; 
  const angleStepForPile1 = cards[((me + 1) % 4)].length > 1 ? 50 / (cards[((me + 1) % 4)].length - 1) : 0; 
  const angleStepForPile2 = cards[((me + 2) % 4)].length > 1 ? 50 / (cards[((me + 2) % 4)].length - 1) : 0; 
  const angleStepForPile3 = cards[((me + 3) % 4)].length > 1 ? 50 / (cards[((me + 3) % 4)].length - 1) : 0; 
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
}

async function playBot(botId, newCards, newPlayedCards) {
  let card = "none";
  let next = botId;
    let ordinaryCards;
    let turn = next;
    let botCards = newCards[botId];
    let newAnnouncements = announcements;
    let duos = [['QS', 'KS'], ['QH', 'KH'], ['QD', 'KD'], ['QC', 'KC']];
    let cardCodes = new Set(newCards[botId].map(card => card.code));
    let [s, h, d, c] = duos.map(([card1, card2]) => (cardCodes.has(card1) && cardCodes.has(card2)));
    if(!newAnnouncements.map(announcement => announcement.suit).includes("H") && h) {
      if(newAnnouncements.length==0) {
        botCards = botCards.filter(card => card.code == "KH" || card.code == "QH");
      }
      newAnnouncements = [...newAnnouncements, {player: botId, suit: "H"}];
    }
    if(!newAnnouncements.map(announcement => announcement.suit).includes("S") && s) {
      if(newAnnouncements.length==0) {
        botCards = botCards.filter(card => card.code == "KS" || card.code == "QS");
      }
      newAnnouncements = [...newAnnouncements, {player: botId, suit: "S"}];
    }
    if(!newAnnouncements.map(announcement => announcement.suit).includes("C") && c) {
      if(newAnnouncements.length==0) {
        botCards = botCards.filter(card => card.code == "KC" || card.code == "QC");
      }
      newAnnouncements = [...newAnnouncements, {player: botId, suit: "C"}];
    }
    if(!newAnnouncements.map(announcement => announcement.suit).includes("D") && d) {
      if(newAnnouncements.length==0) {
        botCards = botCards.filter(card => card.code == "KD" || card.code == "QD");
      }
      newAnnouncements = [...newAnnouncements, {player: botId, suit: "D"}];
    }
    setAnnouncements(newAnnouncements);

    if(newPlayedCards.length == 0) {
      let ordinaryCards = newAnnouncements[0] ? botCards.filter(card => card.code[1] != newAnnouncements[0].suit) : botCards;
      let cardsOfSuit = newAnnouncements[0] ? botCards.filter(card => card.code[1] == newAnnouncements[0].suit) : [];
      if(ordinaryCards.length>0) {
        let handBiggest = getBiggestCard(ordinaryCards, true);
        turn = (next+1)%4;
        card = ordinaryCards[handBiggest.maxIndex];
        newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != card.code)];
        newPlayedCards = [...newPlayedCards, {...card, player: botId}];
      } else {
        let handSmallest = getSmallestCard(cardsOfSuit, true);
        turn = (next+1)%4;
        card = cardsOfSuit[handSmallest.minIndex];
        newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != card.code)];
        newPlayedCards = [...newPlayedCards, {...card, player: botId}];
      }
    } else {
      var ofSuit = botCards.filter(card => card.code[1] == [...newPlayedCards][0].code[1]);
    let card = "none";
    if(ofSuit.length > 0) {
      let handBiggest = getBiggestCard(ofSuit, true);
      let possibleBiggest = getBiggestCard([...newPlayedCards, {...ofSuit[handBiggest.maxIndex], player: botId}], true);
      if(ofSuit[handBiggest.maxIndex].code == [...newPlayedCards, {...ofSuit[handBiggest.maxIndex], player: botId}][possibleBiggest.maxIndex].code) {
        turn = (next+1)%4;
        newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != ofSuit[handBiggest.maxIndex].code)];
        newPlayedCards = [...newPlayedCards, {...ofSuit[handBiggest.maxIndex], player: botId}];
        card = ofSuit[handBiggest.maxIndex];
      }
    } if(turn != (next+1)%4 && newAnnouncements.length > 0) {
      let suit = newPlayedCards[0].code[1];
      let ofThisSuit = [...newPlayedCards].filter((card) => card.code[1] == suit); 
      if(newAnnouncements[0] && suit != newAnnouncements[0].suit){
        let trumps = [...newPlayedCards].filter(card => card.code[1] == newAnnouncements[0].suit);
        if(trumps.length > 0) {
          suit = newAnnouncements[0].suit;
          ofThisSuit = trumps;
        }
      }
      let biggestCardInfo = getBiggestCard(ofThisSuit, true);
      let winners = [...newPlayedCards].filter(card => card.code[1] == suit && card.code[0] == biggestCardInfo.maxCard);
      let windex = winners[0].player;
      if(windex%2!=botId%2) {
        ofSuit = botCards.filter(card => card.code[1] == newAnnouncements[0].suit);
      if(ofSuit.length > 0) {
        let handBiggest = getBiggestCard(ofSuit, true);
        let possibleBiggest = getBiggestCard([...newPlayedCards.filter(currentCard => currentCard.code[1] == newAnnouncements[0].suit), {...ofSuit[handBiggest.maxIndex], player: botId}], true);
        if(handBiggest.maxCard == possibleBiggest.maxCard) {
          turn = (next+1)%4;
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != `${handBiggest.maxCard}${newAnnouncements[0].suit}`)];
          newPlayedCards = [...newPlayedCards, {...ofSuit[handBiggest.maxIndex], player: botId}];
          card = ofSuit[handBiggest.maxIndex];
        }
      }
      }
    } if(turn != (next+1) % 4) {
      turn = (next+1)%4;
      let suit = newPlayedCards[0].code[1];
      let ofThisSuit = [...newPlayedCards].filter((card) => card.code[1] == suit); 
      if(newAnnouncements[0] && suit != newAnnouncements[0].suit){
        let trumps = [...newPlayedCards].filter(card => card.code[1] == newAnnouncements[0].suit);
        if(trumps.length > 0) {
          suit = newAnnouncements[0].suit;
          ofThisSuit = trumps;
        }
      }
    let biggestCardInfo = getBiggestCard(ofThisSuit, true);
    let winners = [...newPlayedCards].filter(card => card.code[1] == suit && card.code[0] == biggestCardInfo.maxCard);
    let windex = winners[0].player;
    if(windex%2 == (botId)%2) {
      if(newAnnouncements.length > 0) {
        let cardsOfSuit=[], ordinaryCards=[];
        cardsOfSuit = botCards.filter(card => card.code[1] == newAnnouncements[0].suit);
        ordinaryCards = botCards.filter(card => (card.code[1] != newAnnouncements[0].suit) && (card.code[0] != "6"));
        if(ordinaryCards.length > 0) {
          let biggestInfo = getBiggestCard(ordinaryCards, true);
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != ordinaryCards[biggestInfo.maxIndex].code)];
          newPlayedCards = [...newPlayedCards, {...ordinaryCards[biggestInfo.maxIndex], player: botId}];
          card = ordinaryCards[biggestInfo.maxIndex];
        } else {
          const smallestInfo = getSmallestCard(cardsOfSuit, true);
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != cardsOfSuit[smallestInfo.minIndex].code)];
          newPlayedCards = [...newPlayedCards, {...cardsOfSuit[smallestInfo.minIndex], player: botId}];
          card = cardsOfSuit[smallestInfo.minIndex];
        }
      } else {
          ordinaryCards = botCards.filter(card => card.code[0] != "6");
          let biggestInfo = getBiggestCard(ordinaryCards, true);
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != ordinaryCards[biggestInfo.maxIndex].code)];
          newPlayedCards = [...newPlayedCards, {...ordinaryCards[biggestInfo.maxIndex], player: botId}];
          card = ordinaryCards[biggestInfo.maxIndex];
      }
      } else {
        let ordinaryCards = botCards.filter(card => (card.code[0] != "6"));
        let cardsOfSuit = newAnnouncements[0] ? botCards.filter(card => card.code[1] == newAnnouncements[0].suit) : [];
        if(ordinaryCards.length > 0) {
          let smallestInfo = getSmallestCard(ordinaryCards, true);
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != ordinaryCards[smallestInfo.minIndex].code)];
          newPlayedCards = [...newPlayedCards, {...ordinaryCards[smallestInfo.minIndex], player: botId}];
          card = ordinaryCards[smallestInfo.minIndex];
        } else {
          let smallestInfo = getSmallestCard(cardsOfSuit, true);
          newCards[botId] = [...newCards[botId].filter(currentCard => currentCard.code != cardsOfSuit[smallestInfo.minIndex].code)];
          newPlayedCards = [...newPlayedCards, {...cardsOfSuit[smallestInfo.minIndex], player: botId}];
          card = cardsOfSuit[smallestInfo.minIndex];
        }
      }
    }
    if (card === "none" && newAnnouncements.length > 0 && newPlayedCards.length > 0) {
  const leadSuit = newPlayedCards[0].code[1];
  const trumps = botCards.filter(c => c.code[1] === newAnnouncements[0].suit);
  const ofSuit = botCards.filter(c => c.code[1] === leadSuit);

  // If no cards of the current suit but has trumps → play smallest trump
  if (ofSuit.length === 0 && trumps.length > 0) {
    const smallestTrump = getSmallestCard(trumps, true);
    card = trumps[smallestTrump.minIndex];
    newCards[botId] = botCards.filter(c => c.code !== card.code);
    newPlayedCards = [...newPlayedCards, { ...card, player: botId }];
  }
}

// still no decision → play first available card as fallback
if (card === "none") {
  card = newCards[botId][0];
  newPlayedCards = [...newPlayedCards, { ...card, player: botId }];
  newCards[botId] = newCards[botId].filter(c => c.code !== card.code);
}

    }
  setCards(newCards);
   duos = [['QS', 'KS'], ['QH', 'KH'], ['QD', 'KD'], ['QC', 'KC']];
   cardCodes = new Set(newCards[me].map(card => card.code));
   [s, h, d, c] = duos.map(([card1, card2]) => cardCodes.has(card1) && cardCodes.has(card2));
  setHeartsDisabled(announcements.some(announcement => announcement.suit == "H") ? true : !h);
  setSpadesDisabled(announcements.some(announcement => announcement.suit == "S") ? true : !s);
  setClubsDisabled(announcements.some(announcement => announcement.suit == "C") ? true : !c); 
  setDiamondsDisabled(announcements.some(announcement => announcement.suit == "D") ? true : !d);
  setplayedCards(newPlayedCards);
  setTurn((next+1)%4);

  if(newPlayedCards.length == 4) {
    setTimeout(async () => {
      let suit = newPlayedCards[0].code[1];
    let ofThisSuit;
    if(newAnnouncements[0]){
      if(suit == newAnnouncements[0].suit) {
        ofThisSuit = newPlayedCards.filter((card) => card.code[1] == suit).map(card => card.code[0]); 
      } else {
        let trumps = newPlayedCards.filter(card => card.code[1] == newAnnouncements[0].suit).map(card => card.code[0]);
        if(trumps.length > 0) {
          suit = newAnnouncements[0].suit;
          ofThisSuit = trumps;
        } else {
          ofThisSuit = newPlayedCards.filter((card) => card.code[1] == suit).map(card => card.code[0]); 
        }
      }
    } else {
      ofThisSuit = newPlayedCards.filter((card) => card.code[1] == suit).map(card => card.code[0]); 
    }
    let biggestCardInfo = getBiggestCard(ofThisSuit);
    let hand = getHandValue(newPlayedCards.map(card => card.code[0]));
    hand += cards[0].length == 0 ? 10 : 0;
    let winners = newPlayedCards.filter(card => card.code[1] == suit && card.code[0] == biggestCardInfo.maxCard);
    let windex = winners[0].player;
    console.log(winners);
    
    setTurn(windex);
    if(windex % 2 == 0) {
      setScore1(score1+hand);
    } else {
      setScore2(score2+hand);
    }
    setplayedCards([]);
    var newDocForHand = {turn: windex, played_cards: "[]"};
    newPlayedCards = [];
    if(leftCards != 0) {
      for(let i = 0; i < 4; i++) {
        const drawResponse = await fetch(
          `https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`
        );
        const drawData = await drawResponse.json();
        const resp = await fetch(
          `https://www.deckofcardsapi.com/api/deck/${deckId}/pile/player${i}/add/?cards=${drawData.cards[0].code}`
        );
        const log = await resp.json();
        newCards[i].push(drawData.cards[0]);
        if(i==3) {
          newDocForHand.left_cards = log.remaining;
          setLeftCards(log.remaining);
          newDocForHand.cards = newCards;
        }
      }
    }
    setGameInfo(oldInfo => ({...oldInfo, ...newDocForHand}));
    if(players[windex] == "bot" && newCards.filter((val, i) => i != botId).some(x => x.length > 0)) {
      playBot(windex, newCards, newPlayedCards);
    }
    }, 1000);
  } else if(players[(botId+1)%4] == "bot" && newCards.filter((val, i) => i != botId).some(x => x.length > 0)) {
      setTimeout(() => playBot((botId+1)%4, newCards, newPlayedCards), 2000)
    }
}
  
  return (
    <>
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
  {cards[((me + 2) % 4)].map((card, index) => {
  const angle = startAngle + index * angleStepForPile2; 
  return index === cards[((me + 2) % 4)].length - 1 ? (
    <PlayerCard key={index} id={((me + 2) % 4)} index={index} angle={angle}></PlayerCard>
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

  <div style={{ position: "absolute", left: "5%", top: "75%", transform: "translateY(-55%)" }}>
  {cards[((me + 1) % 4)].map((card, index) => {
  const angle = startAngle + index * angleStepForPile1; 
  return index === cards[((me + 1) % 4)].length - 1 ? (
    <PlayerCard style={{border: (turn == ((me + 1) % 4)) ? "3px solid yellow" : "none",
      borderRadius: (turn == ((me + 1) % 4)) ?  "7px" : "0",}} key={index} id={((me + 1) % 4)} index={index} angle={angle}></PlayerCard>
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
        border: (turn == ((me + 1) % 4)) ? "3px solid yellow" : "none",
        borderRadius: (turn == ((me + 1) % 4)) ?  "7px" : "0",
      }}
      alt="Playing Card"
    />
  )
})}
  </div>
  <div style={{ position: "absolute", right: "15%", top: "75%", transform: "translateY(-55%)" }}>
  {cards[((me + 3) % 4)].map((card, index) => {
  const angle = startAngle + index * angleStepForPile3; 
  return index === cards[((me + 3) % 4)].length - 1 ? (
    <PlayerCard key={index} id={((me + 3) % 4)} index={index} angle={angle}></PlayerCard>
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
        border: (turn == ((me + 3) % 4)) ? "3px solid yellow" : "none",
        borderRadius: (turn == ((me + 3) % 4)) ?  "7px" : "0",
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
      onClick={(turn == me) && playedCards.length != 4 && (hasJustAnnounced != "none" && playedCards.length > 0 ? (hasJustAnnounced == card.code[1] && (card.code[0] == "Q" || card.code[0] == "K")) : true) ? async () => { 
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
        let next = (me+1)%4;
        let tOut = false;
        setCards(newCards);
        setplayedCards(newPlayedCards);
        setGameInfo(oldInfo => ({...oldInfo, turn: next, cards: newCards, playedCards: newPlayedCards}));
        if(playedCards.length == 3) {
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
          } else {
            setScore2(score2+hand);
          }
          setplayedCards([]);
          newPlayedCards = [];
          var newDocForHand = {turn: windex, played_cards: "[]"};
          if(leftCards != 0) {
            for(let i = 0; i < 4; i++) {
              const drawResponse = await fetch(
                `https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`
              );
              const drawData = await drawResponse.json();
              const resp = await fetch(
                `https://www.deckofcardsapi.com/api/deck/${deckId}/pile/player${i}/add/?cards=${drawData.cards[0].code}`
              );
              const log = await resp.json();
              newCards[i].push(drawData.cards[0]);
              if(i==3) {
                newDocForHand.left_cards = log.remaining;
                setLeftCards(log.remaining);
                newDocForHand.cards = newCards;
              }
            }
          }
          setGameInfo(oldInfo => ({...oldInfo, ...newDocForHand}));
          if(players[next] == "bot") {
            playBot(next, newCards, newPlayedCards);
          }
          }, 1000);
        }
        if(!tOut) {
          if(players[next] == "bot") {
            playBot(next, newCards, newPlayedCards);
          }
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
              setGameInfo(oldInfo => ({...oldInfo, combinations: [...announcements, {player: me, suit: "H"}]}));
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
              setGameInfo(oldInfo => ({...oldInfo, combinations: [...announcements, {player: me, suit: "S"}]}));
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
              setGameInfo(oldInfo => ({...oldInfo, combinations: [...announcements, {player: me, suit: "D"}]}));
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
              setGameInfo(oldInfo => ({...oldInfo, combinations: [...announcements, {player: me, suit: "C"}]}));
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
