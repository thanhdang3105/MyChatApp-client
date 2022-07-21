import { AddPhotoAlternate, Close, Image, PeopleOutlined } from '@mui/icons-material';
import {
    ListItemButton,
    Modal,
    Fade,
    Box,
    Avatar,
    Typography,
    Button,
    ImageList,
    ImageListItem,
    Backdrop,
    CircularProgress,
    List,
    ListItemAvatar,
    ListItemText,
    ListItem,
    IconButton,
} from '@mui/material';
import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React from 'react';
import { storage } from '../../firebase/config';
import { AppContext } from '../../provider/AppProvider';
import { AuthContext } from '../../provider/AuthProvider';
import { useSelector, useDispatch } from 'react-redux';
import { roomsSelector } from '../../redux/selector';
import styles from '../../scss/modal.module.scss';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { addDocument } from '../../firebase/service';

function SettingModal({ visibleModal: { isSetting, setIsSetting }, info }) {
    const rooms = useSelector(roomsSelector);
    const { socket, currentUser } = React.useContext(AuthContext);
    const { setNotice } = React.useContext(AppContext);
    const [isSetBGR, SetIsSetBGR] = React.useState(false);
    const [newImg, setNewImg] = React.useState(null);
    const [newAvatar, setNewAvatar] = React.useState(null);
    const [fileAvatar, setFileAvatar] = React.useState(null);
    const [newImgUpload, setNewImgUpload] = React.useState(null);
    const [fileUpload, setFileUpload] = React.useState(null);
    const [showMember, setShowMember] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const dispatch = useDispatch();

    const handleChangeBGR = async () => {
        const collection = info.members ? 'rooms' : 'inboxs';
        setLoading(true);
        if (fileUpload) {
            const imgRef = await uploadBytes(ref(storage, fileUpload.name), fileUpload);
            const url = await getDownloadURL(imgRef.ref);
            if (url) {
                setFileUpload(null);
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/' + collection, {
                        action: 'changeBGR',
                        data: { id: info._id, newImg: url },
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            const newListImg = [...info.backgroundList, url];
                            dispatch(
                                currentRoomSlice.actions.updateState({ background: url, backgroundList: newListImg }),
                            );
                            dispatch(
                                roomsSlice.actions.updateState({
                                    id: info._id,
                                    data: { background: url, backgroundList: newListImg },
                                }),
                            );
                            socket.current.emit('roomChange_info', {
                                id: info._id,
                                data: { background: url, backgroundList: newListImg },
                            });
                            if (info.members) {
                                info.members.map((member) => {
                                    if (member._id !== currentUser._id) {
                                        addDocument('notify', { userId: member._id, roomId: info._id });
                                    }
                                    return member;
                                });
                            } else {
                                addDocument('notify', { userId: info.userId, roomId: info._id });
                            }
                            setLoading(false);
                            setNewImgUpload(null);
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        setNotice({ open: true, text: 'Thay ảnh thất bại!' });
                        setLoading(false);
                    });
            } else {
                setLoading(false);
                setNotice({ open: true, text: 'Tải ảnh thất bại!' });
            }
        } else {
            axios
                .post(process.env.REACT_APP_API_URI + '/api/' + collection, {
                    action: 'changeBGR',
                    data: { id: info._id, newImg },
                })
                .then((response) => {
                    if (response.status === 200) {
                        dispatch(currentRoomSlice.actions.updateState({ background: newImg }));
                        dispatch(roomsSlice.actions.updateState({ id: info._id, data: { background: newImg } }));
                        socket.current.emit('roomChange_info', { id: info._id, data: { background: newImg } });
                        if (info.members) {
                            info.members.map((member) => {
                                if (member._id !== currentUser._id) {
                                    addDocument('notify', { userId: member._id, roomId: info._id });
                                }
                                return member;
                            });
                        } else {
                            addDocument('notify', { userId: info.userId, roomId: info._id });
                        }
                        SetIsSetBGR(false);
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setNotice({ open: true, text: 'Lỗi !' });
                    setLoading(false);
                });
        }
    };

    const handleChangeAvatar = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setFileAvatar(file);
                setNewAvatar(reader.result);
            };
            reader.onerror = () => {
                setNewAvatar(null);
                setFileAvatar(null);
                setNotice({ open: true, text: 'Tải ảnh thất bại!' });
            };
        } else {
            setNewAvatar(null);
            setFileAvatar(null);
        }
    };

    const handleDownloadImg = async () => {
        setLoading(true);
        const imgRef = await uploadBytes(ref(storage, fileAvatar.name), fileAvatar);
        const url = await getDownloadURL(imgRef.ref);
        if (url) {
            setNewAvatar(null);
            setFileAvatar(null);
            axios
                .post(process.env.REACT_APP_API_URI + '/api/rooms', {
                    action: 'setAvatar',
                    data: { id: info._id, url },
                })
                .then((res) => {
                    if (res.status === 200) {
                        dispatch(currentRoomSlice.actions.updateState({ photoURL: url }));
                        dispatch(roomsSlice.actions.updateState({ id: info._id, data: { photoURL: url } }));
                        socket.current.emit('roomChange_info', { id: info._id, data: { photoURL: url } });
                        if (info.members) {
                            info.members.map((member) => {
                                if (member._id !== currentUser._id) {
                                    addDocument('notify', { userId: member._id, roomId: info._id });
                                }
                                return member;
                            });
                        } else {
                            addDocument('notify', { userId: info.userId, roomId: info._id });
                        }
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setNotice({ open: true, text: 'Thay ảnh thất bại!' });
                    setLoading(false);
                });
        } else {
            setLoading(false);
            setNotice({ open: true, text: 'Tải ảnh thất bại!' });
        }
    };

    const handleClickMember = (member) => {
        const inbox = rooms.find((room) => room.userId === member._id);
        dispatch(currentRoomSlice.actions.setState(inbox || member));
        SetIsSetBGR(false);
        setShowMember(false);
        setNewAvatar(null);
        setIsSetting(false);
    };

    React.useEffect(() => {
        if (newImgUpload) {
            document.querySelector('img.' + styles['img_active'])?.classList.remove(styles['img_active']);
            document.querySelector(`img[alt="${newImgUpload}"]`).classList.add(styles['img_active']);
            setNewImg(newImgUpload);
        }
    }, [newImgUpload]);

    const handleUploadImg = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setFileUpload(file);
                setNewImgUpload(reader.result);
            };
            reader.onerror = () => {
                setNewImgUpload(null);
                setFileUpload(null);
                setNotice({ open: true, text: 'Tải ảnh thất bại!' });
            };
        } else {
            setNewImgUpload(null);
            setFileUpload(null);
        }
    };

    return (
        <>
            <Modal
                open={isSetting}
                onClose={() => {
                    setNewAvatar(null);
                    setIsSetting(false);
                }}
                aria-labelledby="transition-modal-title"
                closeAfterTransition
            >
                <Fade in={isSetting}>
                    <Box
                        className={styles['modal_wrapper']}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '20px',
                            p: 5,
                        }}
                    >
                        <Backdrop
                            sx={{ color: '#fff', zIndex: 999 }}
                            open={loading}
                            //   onClick={handleClose}
                        >
                            <CircularProgress color="inherit" />
                        </Backdrop>
                        <Button sx={{ borderRadius: 999, p: 0 }} component="label">
                            {info.members && (
                                <input hidden accept="image/*" type="file" onChange={handleChangeAvatar} />
                            )}
                            <Avatar sx={{ width: 100, height: 100, border: 1 }} src={newAvatar || info.photoURL}>
                                {info.photoURL || info.name?.charAt(0).toUpperCase()}
                            </Avatar>
                        </Button>
                        {newAvatar && fileAvatar && <Button onClick={handleDownloadImg}>Đổi ảnh</Button>}
                        <Typography id="transition-modal-title" variant="h4" component="h2">
                            {info.name}
                        </Typography>
                        <Typography variant="span" component="span">
                            {info.description}
                        </Typography>
                        {info.members && (
                            <ListItemButton
                                onClick={() => {
                                    setShowMember(true);
                                    SetIsSetBGR(true);
                                }}
                            >
                                <PeopleOutlined /> Xem thành viên nhóm
                            </ListItemButton>
                        )}

                        {info.users && (
                            <ListItemButton>
                                <PeopleOutlined /> Tạo nhóm với {info.name}
                            </ListItemButton>
                        )}
                        <ListItemButton onClick={() => SetIsSetBGR(true)}>
                            <Image /> Đổi ảnh nền
                        </ListItemButton>
                    </Box>
                </Fade>
            </Modal>
            <Modal
                open={isSetBGR}
                onClose={() => {
                    SetIsSetBGR(false);
                    setShowMember(false);
                }}
                aria-labelledby="transition-modal-title"
                closeAfterTransition
            >
                <Fade in={isSetBGR}>
                    <Box className={styles['modal_wrapper']}>
                        {showMember ? (
                            <List>
                                {info.members.map((member) => (
                                    <ListItem key={member._id}>
                                        <ListItemButton
                                            onClick={() => {
                                                if (member._id === currentUser._id) {
                                                    return;
                                                }
                                                handleClickMember(member);
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar alt={member.name} src={member.photoURL} />
                                            </ListItemAvatar>
                                            <ListItemText primary={member.name} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <>
                                <ImageList
                                    sx={{ width: '100%', height: 'fit-content' }}
                                    md={{ width: '70vw' }}
                                    cols={3}
                                >
                                    {info.backgroundList?.map((item) => (
                                        <ImageListItem key={item}>
                                            <img
                                                src={item}
                                                srcSet={item}
                                                alt={item}
                                                loading="lazy"
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    document
                                                        .querySelector('img.' + styles['img_active'])
                                                        ?.classList.remove(styles['img_active']);
                                                    e.target.classList.add(styles['img_active']);
                                                    setNewImg(item);
                                                }}
                                            />
                                        </ImageListItem>
                                    ))}
                                    {newImgUpload ? (
                                        <ImageListItem>
                                            <img
                                                src={newImgUpload}
                                                srcSet={newImgUpload}
                                                alt={newImgUpload}
                                                loading="lazy"
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    document
                                                        .querySelector('img.' + styles['img_active'])
                                                        ?.classList.remove(styles['img_active']);
                                                    e.target.classList.add(styles['img_active']);
                                                    setNewImg(newImgUpload);
                                                }}
                                            />
                                            <IconButton
                                                sx={{ width: 'fit-content', m: '0 auto' }}
                                                onClick={() => {
                                                    setNewImgUpload(null);
                                                    setNewImg(null);
                                                    setFileUpload(null);
                                                }}
                                            >
                                                <Close />
                                            </IconButton>
                                        </ImageListItem>
                                    ) : (
                                        <ImageListItem>
                                            <Button component="label" sx={{ justifyContent: 'center', height: '100%' }}>
                                                <input hidden accept="image/*" type="file" onChange={handleUploadImg} />
                                                <AddPhotoAlternate />
                                            </Button>
                                        </ImageListItem>
                                    )}
                                </ImageList>
                                <Button
                                    variant="contained"
                                    startIcon={loading && <CircularProgress color="success" size={20} />}
                                    onClick={handleChangeBGR}
                                    disabled={!newImg}
                                >
                                    Đổi
                                </Button>
                            </>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </>
    );
}

export default React.memo(SettingModal);
