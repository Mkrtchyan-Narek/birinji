import { Alert, Snackbar } from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { setSnackbar } from "../store/slices/userReducer";

export default function MySnackbar(props) {
  const dispatch = useDispatch();
  function handleClose() {
    change(false);
    dispatch(
      setSnackbar({
        show: false,
        message: "",
        type: "info",
      })
    );
  }
  const [opened, change] = React.useState(true);
  if(props.anchor) {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClose} anchorOrigin={props.anchor}>
        <Alert onClose={handleClose} severity={props.type} sx={{ width: "100%" }}>
          {props.message}
        </Alert>
      </Snackbar>
    );
  } else if(props.sx) {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClose} sx={props.sx}>
        <Alert onClose={handleClose} severity={props.type} sx={{ width: "100%" }}>
          {props.message}
        </Alert>
      </Snackbar>
    );
  } else {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={props.type} sx={{ width: "100%" }}>
          {props.message}
        </Alert>
      </Snackbar>
    );
  }
  
}
