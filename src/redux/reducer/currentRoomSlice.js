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
