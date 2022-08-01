import React from 'react';
import { AuthContext } from './AuthProvider';
import { useDispatch, useSelector } from 'react-redux';
import { currentRoomSlice } from '../redux/reducer/currentRoomSlice';
import { roomsSlice } from '../redux/reducer/roomsSlice';
import { usersSlice } from '../redux/reducer/usersSlice';
import { currentRoomSelector } from '../redux/selector';
import { updateDocument } from '../firebase/service';

export const AppContext = React.createContext();

export default function AppProvider({ children }) {
    const { socket, currentUser } = React.useContext(AuthContext);
    const currentRoom = useSelector(currentRoomSelector);
    // const rooms = useSelector(roomsSelector);
    const [isVisibleMobileSider, setIsVisibleMobileSider] = React.useState(false);
    const [notice, setNotice] = React.useState({ open: false, text: '' });
    const [alert, setAlert] = React.useState({ open: false, data: null });
    const [calling, setCalling] = React.useState({ isCalling: false, name: null, id: null });
    const [openModalPreviewImg, setOpenModalPreviewImg] = React.useState({ open: false, id: null });
    const dispatch = useDispatch();

    React.useEffect(() => {
        socket.current.on('user_online', (data) => {
            dispatch(currentRoomSlice.actions.checkOnline(data));
            dispatch(usersSlice.actions.checkOnline(data));
            dispatch(roomsSlice.actions.checkOnline(data));
        });
    }, [socket, dispatch]);

    React.useEffect(() => {
        socket.current.on('recive_userMsg', (data) => {
            // data.new = true;
            dispatch(roomsSlice.actions.addRoom(data));
            socket.current.emit('join_room', data._id);
        });

        socket.current.on('user_outRoom', (data) => {
            if (currentRoom._id === data.room) {
                const newMember = currentRoom.members.filter((member) => member._id !== data.userId);
                dispatch(currentRoomSlice.actions.updateState({ members: newMember }));
            }
            dispatch(roomsSlice.actions.changeMembers({ id: data.room, data: data.userId }));
        });

        socket.current.on('recive_newRoom', (data) => {
            // setCurrentRooms(data)
            dispatch(roomsSlice.actions.addRoom(data));
            socket.current.emit('join_room', data._id);
        });

        socket.current.on('roomChange_info', (data) => {
            if (currentRoom._id === data.id) {
                dispatch(currentRoomSlice.actions.updateState(data.data));
            }
            dispatch(roomsSlice.actions.updateState({ id: data.id, data: data.data }));
            // socket.current.emit('join_room', data._id);
        });
    }, [socket, dispatch, currentRoom]);

    React.useEffect(() => {
        socket.current.on('msgRemoved', ({ idRoom, idMsg }) => {
            dispatch(currentRoomSlice.actions.removeMsg({ idRoom, idMsg }));
            dispatch(roomsSlice.actions.removeMsg({ idRoom, idMsg }));
        });
        socket.current.on('userChangeInfo', (data) => {
            dispatch(usersSlice.actions.updateUser({ id: data._id, data }));
            dispatch(roomsSlice.actions.memberChangeInfo({ id: data._id, data }));
            dispatch(currentRoomSlice.actions.changeInfo({ id: data._id, data }));
        });
        socket.current.on('send_call', (data) => {
            if (window.location !== '/videoCall') {
                setCalling({ isCalling: true, name: data.name, id: data.from });
            } else {
                setCalling({ isCalling: false, name: null, id: null });
                socket.current.emit('answer_call', { id: data.from, mess: 'Người dùng hiện đang có cuộc gọi khác' });
            }
        });
    }, [socket, dispatch]);

    React.useEffect(() => {
        setIsVisibleMobileSider(false);
        if (currentRoom && currentRoom.background) {
            document.body.style.backgroundImage = 'url(' + currentRoom.background + ')';
        }
    }, [currentRoom]);

    const chooseRoom = React.useCallback(
        (room) => {
            dispatch(currentRoomSlice.actions.setState(room));
            dispatch(roomsSlice.actions.setStatus({ id: room._id, status: false }));
            if (room.new) {
                updateDocument('notify', { userId: currentUser._id, roomId: room._id });
            }
        },
        [dispatch, currentUser],
    );

    return (
        <AppContext.Provider
            value={{
                notice,
                setNotice,
                isVisibleMobileSider,
                setIsVisibleMobileSider,
                alert,
                setAlert,
                chooseRoom,
                calling,
                setCalling,
                openModalPreviewImg,
                setOpenModalPreviewImg,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
