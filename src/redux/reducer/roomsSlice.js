import { createSlice } from '@reduxjs/toolkit';
import { updateDocument } from '../../firebase/service';

export const roomsSlice = createSlice({
    name: 'rooms',
    initialState: [],
    reducers: {
        setState: (state, { payload }) => {
            return payload;
        },
        addRoom: (state, { payload }) => {
            return [payload, ...state];
        },
        setStatus: (state, { payload }) => {
            const check = state.find((item) => item._id === payload.id);
            if (check) {
                check.new = payload.status;
            }
            return state;
        },
        updateState: (state, { payload }) => {
            const check = state.find((room) => room._id === payload.id);
            if (check) {
                Object.keys(payload.data).map((key, index) => {
                    check[key] = Object.values(payload.data)[index];
                    return key;
                });
                check.lastested = Date.now();
                state.sort((a, b) => {
                    const tA = new Date(a.lastested).getTime();
                    const tB = new Date(b.lastested).getTime();
                    return tB - tA;
                });
            }
            return state;
        },
        checkNotify: (state, { payload }) => {
            const { id, notify, currentRoomId } = payload;
            state.map((room) => {
                notify.map((notice) => {
                    if (notice === room._id) {
                        if (notice === currentRoomId) {
                            room.new = false;
                            updateDocument('notify', { userId: id, roomId: notice });
                        } else {
                            room.new = true;
                        }
                    }
                    return notice;
                });
                return room;
            });
            return state;
        },
        checkOnline: (state, { payload }) => {
            state.map((room) => {
                if (payload.includes(room.userId)) {
                    room.online = true;
                } else {
                    room.online = false;
                }
                return room;
            });
            return state;
        },
        changeMembers: (state, { payload }) => {
            const check = state.find((room) => room._id === payload.id);
            if (check) {
                check.members = check.members.filter((member) => member._id !== payload.data);
            }
            return state;
        },
        memberChangeInfo: (state, { payload }) => {
            return state.map((room) => {
                room.members.map((member) => {
                    if (member._id === payload.id) {
                        member.name = payload.data.name;
                        member.photoURL = payload.data.photoURL;
                    }
                    return member;
                });
                room.messages.map((message) => {
                    if (message.userId === payload.id) {
                        message.name = payload.data.name;
                        message.photoURL = payload.data.photoURL;
                    }
                    return message;
                });
                return room;
            });
        },
    },
});
