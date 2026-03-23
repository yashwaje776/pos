import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  staff: [], // 🔥 new state for staff members
  
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    removeUser: (state) => {
      state.user = null;
    },
    setStaff: (state, action) => {
      state.staff = action.payload;
    },
  },
});

export const { setUser, removeUser, setStaff } = userSlice.actions;
export default userSlice.reducer;