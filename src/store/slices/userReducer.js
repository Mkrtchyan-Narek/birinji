import { createSlice } from "@reduxjs/toolkit";

const userReducer = createSlice({
  name: "user",
  initialState: {
    userData: {},
    isLoggedIn: false,
    imgLink: "",
    snackbar: {
      show: false,
      type: "",
      message: "",
    },
    isAuthenticating: true,
    currentChat: "",
    profileValue: 0,
    signUp: false,
  },

  reducers: {
    updateUserData(state, action) {
      const { field, value } = action.payload;
      state.userData[field] = value;
    },
    setGame : (state, action) => {
      state.game = action.payload;
    },
    setUser: (state, action) => {
      state.userData = action.payload;
    },
    setLog: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    setImgLink: (state, action) => {
      state.imgLink = action.payload;
    },
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
    },
    setRem: (state, action) => {
      state.remember = action.payload;
    },
    setIsAuthenticating: (state, action) => {
      state.isAuthenticating = false;
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addChat: (state, action) => {
      state.userData.chats.push(action.payload);
    },
    setProfileValue: (state, action) => {
      state.profileValue++;
    },
    setSignUp: (state, action) => {
      state.signUp = action.payload;
    },
  },
});

export default userReducer.reducer;

export const {
  updateSetting,
  setUser,
  setGame,
  setLog,
  setRem,
  setImgLink,
  setSnackbar,
  setIsAuthenticating,
  updateUserData,
  setCurrentChat,
  addChat,
  setProfileValue,
  setSignUp,
} = userReducer.actions;

export const getUser = (state) => state.user.userData;
export const getLog = (state) => state.user.isLoggedIn;
export const getRem = (state) => state.user.remember;
export const getImgLink = (state) => state.user.imgLink;
export const getSnackbar = (state) => state.user.snackbar;
export const getIsAuthenticating = (state) => state.user.isAuthenticating;
export const getCurrentChat = (state) => state.user.currentChat;
export const getProfileValue = (state) => state.user.profileValue;
export const getSignUp = (state) => state.user.signUp;
