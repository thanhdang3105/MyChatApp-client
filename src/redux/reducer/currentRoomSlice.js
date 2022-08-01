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
            const { id, messages } = payload;
            if (state._id === id) {
                return { ...state, messages: [...state.messages, ...messages] };
            }
            return state;
        },
        removeMsg: (state, { payload }) => {
            const { idRoom, idMsg } = payload;
            if (state._id === idRoom) {
                const msg = state.messages.find((msg) => msg._id === idMsg);
                if (msg) {
                    msg.removed = true;
                }
            }
            return state;
        },
        changeInfo: (state, { payload }) => {
            const { id, data } = payload;
            const newMSG = state.messages.map((message) => {
                if (message.userId === id) {
                    return { ...message, name: data.name, photoURL: data.photoURL };
                }
                return message;
            });
            if (state.userId === id) {
                return { ...state, name: data.name, photoURL: data.photoURL, messages: newMSG };
            }
            return { ...state, messages: newMSG };
        },
    },
});
