import { createSlice } from '@reduxjs/toolkit';

export const currentRoomSlice = createSlice({
    name: 'currentRoom',
    initialState: {},
    reducers: {
        setState: (state, { payload }) => {
            return payload;
        },
        updateState: (state, { payload }) => {
            return { ...state, ...payload };
        },
        checkOnline: (state, { payload }) => {
            if (payload.includes(state.userId)) {
                state.online = true;
            } else {
                state.online = false;
            }
            return state;
        },
        newMessages: (state, { payload }) => {
            if (state._id === payload.id) {
                return { ...state, messages: [...state.messages, payload.messages] };
            }
            return state;
        },
    },
});
