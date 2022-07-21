import { configureStore } from '@reduxjs/toolkit';

import { usersSlice } from './reducer/usersSlice';
import { roomsSlice } from './reducer/roomsSlice';
import { currentRoomSlice } from './reducer/currentRoomSlice';

export const store = configureStore({
    reducer: {
        users: usersSlice.reducer,
        rooms: roomsSlice.reducer,
        currentRoom: currentRoomSlice.reducer,
    },
});
