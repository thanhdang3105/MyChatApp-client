import React from 'react';
import styles from '../../scss/homePage.module.scss';
import { List, Box, IconButton, TextareaAutosize } from '@mui/material';
import { Send } from '@mui/icons-material';
import { AuthContext } from '../../provider/AuthProvider';
import axios from 'axios';
import { AppContext } from '../../provider/AppProvider';
import ItemMsg from '../customComponents/ItemMsg';
import { useSelector, useDispatch } from 'react-redux';
import { currentRoomSelector, roomsSelector } from '../../redux/selector';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { addDocument } from '../../firebase/service';

function ChatWindow() {
    const { currentUser, socket } = React.useContext(AuthContext);
    const currentRoom = useSelector(currentRoomSelector);
    const rooms = useSelector(roomsSelector);
    const { setNotice, setAlert } = React.useContext(AppContext);
    const [msgRevice, setMsgRevice] = React.useState(null);
    const listRef = React.useRef();

    const dispatch = useDispatch();

    React.useEffect(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [currentRoom]);

    React.useEffect(() => {
        console.log('render');
        socket.current.on('recive_msg', (data) => {
            setMsgRevice(data);
        });
    }, [socket]);

    React.useEffect(() => {
        if (msgRevice) {
            const { foreignId, ...value } = msgRevice;
            dispatch(currentRoomSlice.actions.newMessages({ id: foreignId, messages: value }));
            rooms.map((room) => {
                if (room._id === foreignId) {
                    dispatch(
                        roomsSlice.actions.updateState({
                            id: foreignId,
                            data: { messages: [...room.messages, value] },
                        }),
                    );
                }
                if (room._id === foreignId && room._id !== currentRoom._id) {
                    if (room.members) {
                        setAlert({
                            open: true,
                            data: { foreignId, name: room.name, photoURL: room.photoURL, text: value.text },
                        });
                    } else {
                        setAlert({ open: true, data: { ...value, foreignId } });
                    }
                    // dispatch(roomsSlice.actions.setStatus({ id: foreignId, status: true }));
                }
            });
            setMsgRevice(null);
        }
    }, [msgRevice]);

    const sendNotifi = (roomId) => {
        rooms.map((room) => {
            if (room._id === roomId) {
                if (room.members) {
                    room.members.map((member) => {
                        if (member._id !== currentUser._id) {
                            addDocument('notify', { userId: member._id, roomId });
                        }
                        return member;
                    });
                } else if (room.userId !== currentUser._id) {
                    addDocument('notify', { userId: room.userId, roomId });
                }
            }
            return room;
        });
    };

    const handleSubmit = (form) => {
        const dataFrm = new FormData(form);
        const msg = dataFrm.get('Message');
        if (msg) {
            const newMsg = {
                foreignId: currentRoom._id,
                userId: currentUser._id,
                text: msg,
                photoURL: currentUser.photoURL,
                name: currentUser.name,
                createdAt: Date.now(),
            };
            if (!currentRoom.messages) {
                form[0].value = '';
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/inboxs', {
                        action: 'create',
                        data: { users: [currentUser._id, currentRoom._id], lastested: Date.now(), newMsg },
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            const newInbox = {
                                ...res.data,
                                userId: currentRoom._id,
                                name: currentRoom.name,
                                photoURL: currentRoom.photoURL,
                                messages: [newMsg],
                            };
                            dispatch(currentRoomSlice.actions.setState(newInbox));
                            dispatch(roomsSlice.actions.addRoom(newInbox));
                            addDocument('notify', {
                                userId: currentRoom._id,
                                roomId: res.data._id,
                                lastested: Date.now(),
                            });
                            socket.current.emit('send_message-toUsers', {
                                to: currentRoom._id,
                                newInbox: {
                                    ...res.data,
                                    userId: currentUser._id,
                                    name: currentUser.name,
                                    photoURL: currentUser.photoURL,
                                    messages: [newMsg],
                                },
                            });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        setNotice({ open: true, text: 'Lỗi!' });
                    });
            } else {
                form[0].value = '';
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/messages', {
                        action: 'create',
                        data: {
                            ...newMsg,
                            foreignId: currentRoom._id,
                        },
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            const { foreignId, ...value } = newMsg;
                            const newMessages = [...currentRoom.messages, value];
                            dispatch(currentRoomSlice.actions.updateState({ messages: newMessages }));
                            dispatch(
                                roomsSlice.actions.updateState({ id: foreignId, data: { messages: newMessages } }),
                            );
                            sendNotifi(foreignId);
                            socket.current.emit('send_message-toRoom', { to: foreignId, msg: newMsg });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        setNotice({ open: true, text: 'Lỗi!' });
                    });
            }
        }
    };

    return (
        <Box className={styles['chatwindow_wrapper']}>
            <List ref={listRef} className={styles['chatwindow_wrapper-listMsg']}>
                {!currentRoom.messages?.length
                    ? ''
                    : currentRoom.messages.map((message, index) => (
                          <ItemMsg message={message} currentUser={currentUser} key={index} />
                      ))}
            </List>
            <Box
                component={'form'}
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(e.target);
                }}
                className={styles['chatwindow_input']}
            >
                <TextareaAutosize
                    name="Message"
                    // onInput={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter') {
                            e.preventDefault();
                            handleSubmit(e.target.form);
                        }
                    }}
                    placeholder="Nhập văn bản..."
                    className={styles['chatwindow_input-textArea']}
                    style={{ width: '100%', lineHeight: 2, paddingRight: '30px' }}
                />
                <IconButton
                    type="submit"
                    className={styles['chatwindow_input-icon']}
                    aria-label="send_mess"
                    component="button"
                >
                    <Send />
                </IconButton>
            </Box>
        </Box>
    );
}

export default ChatWindow;
