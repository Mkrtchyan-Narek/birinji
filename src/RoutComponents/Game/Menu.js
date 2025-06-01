import React, { useState, useEffect, useRef } from 'react';
import Paper from "@mui/material/Paper";
import { Dialog } from "@mui/material";
import Draggable from "react-draggable";
import { db } from '../../firebase';
import {
  doc,
  updateDoc,
} from "firebase/firestore";
import Bar from "./TimingBarMiniGame";

export default function Menu({setOpen, actions, me, gameId }) {
  const [actionInfo, setActionInfo] = React.useState({open: false});

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.code === 'ControlRight') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  function setAction(n) {
    switch(n) {
      case 1:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "card of hearts"}])});
        break;
      case 2:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "card of spades"}])});
        break;
      case 3:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "card of diamonds"}])});
        break;
      case 4:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "card of clubs"}])});
        break;
      case 5:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "?"}])});
        break;
      case 6:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "high value card"}])});
        break;
      case 7:
        updateDoc(doc(db, "games", gameId), {actions: JSON.stringify([...actions, {player: me, receivers: [0, 1, 2, 3].filter(a => a != me), type: "request", value: "card of trumps"}])});
        break;
      default:
        setActionInfo({open: true, value: n, me, gameId, actions});
    }

  }

  return (
    <Dialog
      open={true}
      PaperComponent={PaperComponent}
    >
      <div style={{display: "flex", flexDirection: "column", width: "580px", height: "370px", padding: "10px"}}>
        <div style={{width: "580px", height: "100px", display: "flex", flexDirection: "row", position: "relative"}}>
          <img onClick={() => setOpen(false)} style={{width: "40px", height: "40px", position: "absolute", left: "540px"}} src="https://wallpapers.com/images/hd/black-cross-symbol-yvjj7spdjc34pqcg-2.png"/>
          <p style={{ fontSize: "30px", position: "absolute", left: "160px", bottom: "33px"}}>Quick Action Menu</p>
        </div>
        <p style={{marginTop: "-40px", paddingLeft: "10px", fontWeight: "bold", fontSize: "20px"}}>To all</p>
        <div style={{top: "-10px", display: "flex", position: "relative", flexDirection: "row"}}>
          <img onClick={() => setAction(1)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "10px"}} src="https://cdn.creazilla.com/cliparts/3158304/heart-clipart-md.png"/>
          <img onClick={() => setAction(2)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "60px"}} src="https://static-00.iconduck.com/assets.00/spades-icon-1793x2048-pazqul4w.png"/>
          <img onClick={() => setAction(3)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "110px"}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/SuitDiamonds.svg/800px-SuitDiamonds.svg.png"/>
          <img onClick={() => setAction(4)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "160px"}} src="https://cdn.creazilla.com/icons/3208104/cards-club-icon-md.png"/>
          <img onClick={() => setAction(5)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "250px"}} src="https://www.freeiconspng.com/thumbs/question-mark-icon/black-question-mark-icon-clip-art-10.png"/>
          <img onClick={() => setAction(6)} style={{border: "3.5px solid black", width: "40px", height: "40px", position: "absolute", left: "300px"}} src="https://cdn1.iconfinder.com/data/icons/wayfinding-signage/100/Arrow_Up-512.png"/>
          <img onClick={() => setAction(7)} style={{width: "47px", height: "47px", position: "absolute", left: "350px"}} src="https://static-00.iconduck.com/assets.00/card-joker-icon-2048x2048-7foz2mmh.png"/>
        </div>
        <p style={{marginTop: "70px", paddingLeft: "10px", fontWeight: "bold", fontSize: "20px"}}>Try the sneaky way</p>
        <div style={{ position: "relative", paddingTop: "60px" }}>

  <div style={{ display: "flex", gap: "10px", position: "absolute", top: "-10px", left: "10px" }}>
    <img onClick={() => setAction("Hearts")} style={{ border: "3.5px solid black", width: "40px", height: "40px" }} src="https://cdn.creazilla.com/cliparts/3158304/heart-clipart-md.png" />
    <img onClick={() => setAction("Spades")} style={{ border: "3.5px solid black", width: "40px", height: "40px" }} src="https://static-00.iconduck.com/assets.00/spades-icon-1793x2048-pazqul4w.png" />
    <img onClick={() => setAction("Diamonds")} style={{ border: "3.5px solid black", width: "40px", height: "40px" }} src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/SuitDiamonds.svg/800px-SuitDiamonds.svg.png" />
    <img onClick={() => setAction("Clubs")} style={{ border: "3.5px solid black", width: "40px", height: "40px" }} src="https://cdn.creazilla.com/icons/3208104/cards-club-icon-md.png" />
  </div>

  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "0px", marginLeft: "10px" }}>
    {["8", "9", "10", "J", "Q", "K", "7", "A", "6"].map((val, i) => (
      <div key={i} style={{
        border: "3.5px solid black",
        width: i==2 ? "50px" : "40px",
        height: "40px",
        fontWeight: "bold",
        fontSize: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={() => setAction(val)}>
        <p style={{ margin: 0 }}>{val}</p>
      </div>
    ))}
  </div>
</div>
      </div>
      {actionInfo.open ? <Bar actionInfo={actionInfo} setActionInfo={setActionInfo}></Bar> : true}
    </Dialog>
  );
}
