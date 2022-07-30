import React from 'react';
import styles from '../../scss/homePage.module.scss';
import { List, Box, IconButton, TextareaAutosize, CircularProgress } from '@mui/material';
import { AddPhotoAlternate, HighlightOff, Send } from '@mui/icons-material';
import { AuthContext } from '../../provider/AuthProvider';
import axios from 'axios';
import { AppContext } from '../../provider/AppProvider';
import ItemMsg from '../customComponents/ItemMsg';
import { useSelector, useDispatch } from 'react-redux';
import { currentRoomSelector, roomsSelector } from '../../redux/selector';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { addDocument } from '../../firebase/service';
import EmojiComponent from '../customComponents/EmojiComponent';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { storage } from '../../firebase/config';
import ListImgSwiper from '../modal/ListImgSwiper';

function ChatWindow() {
    const { currentUser, socket } = React.useContext(AuthContext);
    const currentRoom = useSelector(currentRoomSelector);
    const rooms = useSelector(roomsSelector);
    const { setNotice, setAlert } = React.useContext(AppContext);
    const [msgRevice, setMsgRevice] = React.useState(null);
    const [listImg, setListImg] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [openModalPreviewImg, setOpenModalPreviewImg] = React.useState({ open: false, id: null });
    const listRef = React.useRef();

    const dispatch = useDispatch();

    React.useEffect(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [currentRoom]);

    React.useEffect(() => {
        socket.current.on('recive_msg', (data) => {
            setMsgRevice(data);
        });
    }, [socket]);

    React.useEffect(() => {
        if (msgRevice) {
            const { foreignId, value } = msgRevice;
            dispatch(currentRoomSlice.actions.newMessages({ id: foreignId, messages: value }));
            rooms.map((room) => {
                if (room._id === foreignId) {
                    dispatch(
                        roomsSlice.actions.updateState({
                            id: foreignId,
                            data: { messages: [...room.messages, ...value] },
                        }),
                    );
                }
                if (room._id === foreignId && room._id !== currentRoom._id) {
                    const notifyMess = value[value.length - 1];
                    if (room.members) {
                        setAlert({
                            open: true,
                            data: {
                                foreignId,
                                name: room.name,
                                photoURL: room.photoURL,
                                text: notifyMess.type === 'img' ? 'Có tin nhắn mới' : notifyMess.text,
                            },
                        });
                    } else {
                        setAlert({
                            open: true,
                            data: {
                                ...notifyMess,
                                foreignId,
                                text: notifyMess.type === 'img' ? 'Có tin nhắn mới' : notifyMess.text,
                            },
                        });
                    }
                    // dispatch(roomsSlice.actions.setStatus({ id: foreignId, status: true }));
                }
                return room;
            });
            setMsgRevice(null);
        }
    }, [msgRevice, setAlert, dispatch]);

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

    const handleSubmitImg = async (newMsg) => {
        if (listImg && listImg.length) {
            const list = [];
            for (let img of listImg) {
                const imgRef = await uploadString(ref(storage, img.title), img.img, 'data_url');
                list.push(await getDownloadURL(imgRef.ref));
            }
            if (!list.length) {
                return list;
            }
            const newData = { ...newMsg, text: list, type: 'img' };
            setListImg(null);
            axios
                .post(process.env.REACT_APP_API_URI + '/api/messages', {
                    action: 'create',
                    data: newData,
                })
                .then((res) => {
                    if (res.status === 200) {
                        const { foreignId, ...value } = newData;
                        if (newMsg.text) {
                            handleSubmitText(newMsg, value);
                        } else {
                            const newMessages = [...currentRoom.messages, value];
                            dispatch(currentRoomSlice.actions.updateState({ messages: newMessages }));
                            dispatch(
                                roomsSlice.actions.updateState({ id: foreignId, data: { messages: newMessages } }),
                            );
                            socket.current.emit('send_message-toRoom', {
                                to: foreignId,
                                msg: { foreignId, value: [value] },
                            });
                            sendNotifi(foreignId);
                            setLoading(false);
                        }
                    }
                })
                .catch((err) => {
                    setListImg(null);
                    setLoading(false);
                    if (newMsg.text) {
                        setLoading(true);
                        handleSubmitText(newMsg);
                    }
                    console.log(err);
                    setNotice({ open: true, text: 'Lỗi!' });
                });
        } else if (newMsg.text) {
            handleSubmitText(newMsg);
        }
    };

    const handleSubmitText = (newMsg, newMsg2) => {
        axios
            .post(process.env.REACT_APP_API_URI + '/api/messages', {
                action: 'create',
                data: newMsg,
            })
            .then((res) => {
                if (res.status === 200) {
                    const { foreignId, ...value } = newMsg;
                    value.type = 'text';
                    let newMessages = [...currentRoom.messages, value];
                    if (newMsg2) {
                        newMessages = [...currentRoom.messages, newMsg2, value];
                        socket.current.emit('send_message-toRoom', {
                            to: foreignId,
                            msg: { foreignId, value: [newMsg2, value] },
                        });
                    } else {
                        socket.current.emit('send_message-toRoom', {
                            to: foreignId,
                            msg: { foreignId, value: [value] },
                        });
                    }
                    sendNotifi(foreignId);
                    dispatch(currentRoomSlice.actions.updateState({ messages: newMessages }));
                    dispatch(roomsSlice.actions.updateState({ id: foreignId, data: { messages: newMessages } }));
                    setLoading(false);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.log(err);
                setNotice({ open: true, text: 'Lỗi!' });
            });
    };

    const handleChooseEmoji = (_, emojiObject) => {
        const inputText = document.querySelector('textarea[name="Message"]');
        inputText.value = inputText.value + emojiObject.emoji;
    };

    const handleChooseFile = (e) => {
        const list = Array.from(e.target.files);
        if (list.length) {
            list.map((file) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setListImg((prev) => {
                        if (prev) {
                            if (prev.find((img) => img.title === file.name)) {
                                return prev;
                            }
                            return [...prev, { img: reader.result, title: file.name }];
                        }
                        return [{ img: reader.result, title: file.name }];
                    });
                };
                return file;
            });
        }
    };

    const handlePaste = (e) => {
        if (e.clipboardData.types.includes('Files') && e.clipboardData.files[0].type === 'image/png') {
            e.preventDefault();
            const data = e.clipboardData.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(data);
            reader.onload = () => {
                setListImg((prev) => {
                    if (prev) {
                        return [...prev, { img: reader.result, title: data.lastModified + '.jpg' }];
                    }
                    return [{ img: reader.result, title: data.lastModified + '.jpg' }];
                });
            };
        }
    };

    const handleSubmitForm = (value) => {
        if (!value && !listImg && !listImg?.length) {
            return value;
        }
        const newMsg = {
            foreignId: currentRoom._id,
            userId: currentUser._id,
            text: value,
            photoURL: currentUser.photoURL,
            name: currentUser.name,
            createdAt: Date.now(),
        };
        setLoading(true);
        document.querySelector('textarea[name="Message"]').value = '';
        if (!currentRoom.messages) {
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
                        handleSubmitImg({ ...newMsg, foreignId: res.data._id });
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
                    setLoading(false);
                    console.log(err);
                    setNotice({ open: true, text: 'Lỗi!' });
                });
        } else {
            handleSubmitImg(newMsg);
        }
    };

    return (
        <Box className={styles['chatwindow_wrapper']}>
            <ListImgSwiper room={currentRoom} open={{ openModalPreviewImg, setOpenModalPreviewImg }} />
            <List ref={listRef} className={styles['chatwindow_wrapper-listMsg']}>
                {!currentRoom.messages?.length
                    ? ''
                    : currentRoom.messages.map((message, index) => (
                          <ItemMsg
                              message={message}
                              currentUser={currentUser}
                              key={index}
                              isPreview={setOpenModalPreviewImg}
                          />
                      ))}
            </List>
            {listImg && (
                <ul className={styles['list_Img']}>
                    {listImg.map((item) => (
                        <li key={item.title} className={styles['item_listImg']}>
                            <HighlightOff
                                onClick={() => {
                                    setListImg((prev) => {
                                        const newList = prev.filter((img) => img.title !== item.title);
                                        if (newList.length === 0) {
                                            return null;
                                        }
                                        return newList;
                                    });
                                }}
                            />
                            <img src={item.img} srcSet={item.img} alt={item.title} loading="lazy" />
                        </li>
                    ))}
                </ul>
            )}
            <Box
                component={'form'}
                onSubmit={(e) => {
                    e.preventDefault();
                    const dataFrm = new FormData(e.currentTarget);
                    const msg = dataFrm.get('Message');
                    handleSubmitForm(msg);
                }}
                className={styles['chatwindow_input']}
            >
                <EmojiComponent handle={handleChooseEmoji} />
                <IconButton component="label">
                    <input type="file" hidden onChange={handleChooseFile} multiple accept="image/*" />
                    <AddPhotoAlternate style={{ color: 'var(--text-color)' }} />
                </IconButton>
                <TextareaAutosize
                    name="Message"
                    // onInput={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter') {
                            e.preventDefault();
                            handleSubmitForm(e.target.value);
                        }
                    }}
                    onPaste={handlePaste}
                    placeholder="Nhập văn bản..."
                    className={styles['chatwindow_input-textArea']}
                    style={{ width: '100%', lineHeight: 2, paddingRight: '30px' }}
                />
                <IconButton
                    type={loading ? 'button' : 'submit'}
                    className={styles['chatwindow_input-icon']}
                    aria-label="send_mess"
                    component="button"
                >
                    {loading ? (
                        <CircularProgress color="primary" size="16" sx={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Send />
                    )}
                </IconButton>
            </Box>
        </Box>
    );
}

export default ChatWindow;
