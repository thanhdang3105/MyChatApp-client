import { createSlice } from '@reduxjs/toolkit';

export const usersSlice = createSlice({
    name: 'users',
    initialState: [],
    reducers: {
        setState: (state, { payload }) => {
            return payload;
        },
        checkOnline: (state, { payload }) => {
            state.map((user) => {
                if (payload.includes(user._id)) {
                    user.online = true;
                } else {
                    user.online = false;
                }
                return user;
            });
            return state;
        },
        updateUser: (state, { payload }) => {
            return state.map((user) => {
                if (user._id === payload.id) {
                    user = payload.data;
                }
                return user;
            });
        },
    },
});
