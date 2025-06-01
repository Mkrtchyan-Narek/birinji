import React, { useState, useEffect, useRef } from 'react';
import Paper from "@mui/material/Paper";
import { Dialog } from "@mui/material";
import Draggable from "react-draggable";
import { db } from '../../firebase';
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function TimingBarMiniGame({actionInfo, setActionInfo}) {
  const { onFinish, setMinigameOpen, gameId, me, suit } = actionInfo;
  const [position, setPosition] = useState(0); // stop bar position
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [stopped, setStopped] = useState(false);
  const [greenZone, setGreenZone] = useState({ start: 0, width: 120 });
  const animationRef = useRef(null);

  const barWidth = 600;
  const stopBarWidth = 10;
  const moveSpeed = 20;

  // Set random green zone when component mounts
  useEffect(() => {
    const randomPos = Math.floor(Math.random() * (barWidth - greenZone.width));
    setGreenZone((prev) => ({ ...prev, start: randomPos }));
  }, []);

  // Movement logic
  useEffect(() => {
    if (stopped) return;

    function moveBar() {
      setPosition((prev) => {
        let next = prev + moveSpeed * direction;
        if (next < 0 || next > barWidth - stopBarWidth) {
          setDirection((d) => -d); // reverse direction
          return prev; // prevent overshooting
        }
        return next;
      });
    }

    animationRef.current = setInterval(moveBar, 25);

    return () => clearInterval(animationRef.current);
  }, [direction, stopped]);

  // Handle space bar press
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.code === 'Space' && !stopped) {
        setStopped(true);
        clearInterval(animationRef.current);

        const inZone = position >= greenZone.start && position <= greenZone.start + greenZone.width;
        if (onFinish) onFinish(inZone);

        let newActions = actionInfo.actions;
        if(inZone) {
          newActions = [...actionInfo.actions, {player: actionInfo.me, receivers: [(actionInfo.me+2)%4], type: "hint", value: actionInfo.value}];
        } else {
          newActions = [...actionInfo.actions, {player: actionInfo.me, receivers: [0, 1, 2, 3].filter(a => a != actionInfo.me), type: "hint", value: actionInfo.value}];
        }
        updateDoc(doc(db, "games", actionInfo.gameId), {actions: JSON.stringify(newActions)});
        setActionInfo({open: false, me: actionInfo.me, actions: newActions, gameId: actionInfo.gameId});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stopped, position, greenZone, onFinish]);

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

  return (
    <Dialog
      open={true}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: 'red',
          height: '20px',
          width: `${barWidth}px`,
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'green',
            width: `${greenZone.width}px`,
            height: '20px',
            left: `${greenZone.start}px`,
          }}
          id="greenBar"
        ></div>

        <div
          style={{
            position: 'absolute',
            borderTop: '3px solid black',
            borderBottom: '3px solid black',
            height: '15px',
            width: `${stopBarWidth}px`,
            backgroundColor: 'white',
            left: `${position}px`,
          }}
          id="stopBar"
        ></div>
      </div>
    </Dialog>
  );
}
