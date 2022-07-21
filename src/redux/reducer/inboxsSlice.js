import { createSlice } from '@reduxjs/toolkit';

export const inboxsSlice = createSlice({
    name: 'inboxs',
    initialState: [],
    reducers: {
        setState: (state, payload) => {
            return payload;
        },
    },
});
