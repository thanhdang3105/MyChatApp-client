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
            if (!state.find((room) => room._id === payload._id)) {
                return [payload, ...state];
            }
            return state;
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
        removeMsg: (state, { payload }) => {
            const { idRoom, idMsg } = payload;
            const check = state.find((room) => room._id === idRoom);
            if (check) {
                const msg = check.messages.find((msg) => msg._id === idMsg);
                if (msg) {
                    msg.removed = true;
                }
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
            const { id, data } = payload;
            const newRooms = state.map((room) => {
                const newMSG = room.messages.map((message) => {
                    if (message.userId === id) {
                        return { ...message, name: data.name, photoURL: data.photoURL };
                    }
                    return message;
                });
                if (room.members) {
                    const newMembers = room.members.map((member) => {
                        if (member._id === id) {
                            return { ...member, name: data.name, photoURL: data.photoURL };
                        }
                        return member;
                    });
                    return { ...room, members: newMembers, messages: newMSG };
                } else if (room.userId === id) {
                    return { ...room, name: data.name, photoURL: data.photoURL, messages: newMSG };
                }
                return { ...room, messages: newMSG };
            });
            return newRooms;
        },
    },
});
