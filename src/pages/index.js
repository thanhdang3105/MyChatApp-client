import React from 'react';
import styles from '../scss/homePage.module.scss';
import {
    Grid,
    Backdrop,
    CircularProgress,
    Snackbar,
    ClickAwayListener,
    Avatar,
    Typography,
    ListItemButton,
    Box,
    IconButton,
} from '@mui/material';
import SiderBar from '../components/home/SiderBar';
import Home from '../components/home';
import { AuthContext } from '../provider/AuthProvider';
import { AppContext } from '../provider/AppProvider';
import { useSelector } from 'react-redux';
import { roomsSelector } from '../redux/selector';
import { PhoneDisabled, PhoneInTalk } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const { socket, currentUser } = React.useContext(AuthContext);
    const rooms = useSelector(roomsSelector);
    const {
        notice,
        setNotice,
        isVisibleMobileSider,
        setIsVisibleMobileSider,
        alert,
        setAlert,
        chooseRoom,
        calling,
        setCalling,
    } = React.useContext(AppContext);
    const siderbarRef = React.useRef();
    const navigate = useNavigate();

    const handleCloseNotice = () => {
        setNotice({ open: false, text: '' });
        setAlert({ open: false, data: null });
    };

    const handleClickAlert = () => {
        const checkRoom = rooms.find((room) => room._id === alert.data.foreignId);
        if (checkRoom) {
            handleCloseNotice();
            chooseRoom(checkRoom);
        }
    };

    const handleAnswerCall = (answer) => {
        if (answer === 'accept') {
            const checkRoom = rooms.find((room) => room.userId === calling.id);
            if (checkRoom) {
                chooseRoom(checkRoom);
                navigate('/videoCall', { state: { audio: true, video: true, type: 'answer', id: calling.id } });
            }
        } else {
            socket.current.emit('answer_call', { id: calling.id, mess: 'cancel' });
        }
        setCalling({ isCalling: false, name: null, id: null });
    };

    return currentUser ? (
        <Grid container spacing={2} className={styles['wrapper_homePage']} sx={{ height: 'calc(100vh + 16px)' }}>
            <Grid
                item
                xs="auto"
                className={`${styles['wrapper_homePage-siderbar']} ${
                    isVisibleMobileSider ? styles['siderbar_mobile-show'] : ''
                }`}
            >
                <ClickAwayListener
                    mouseEvent="onMouseDown"
                    touchEvent="onTouchStart"
                    onClickAway={() => setIsVisibleMobileSider(false)}
                >
                    <SiderBar ref={siderbarRef} />
                </ClickAwayListener>
            </Grid>
            <Grid item xs={true} className={styles['wrapper_homePage-home']}>
                <Home />
            </Grid>
            <Snackbar
                open={alert.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                autoHideDuration={10000}
                className={styles['alert_homePage']}
                message={
                    alert.data && (
                        <ListItemButton onClick={handleClickAlert} sx={{ width: '100%', flex: 1 }}>
                            <Avatar alt="Avatar" src={alert.data.photoURL} sx={{ border: '1px solid #999', mr: 1 }}>
                                {alert.data.photoURL ? '' : alert.data.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography component="h5" variant="h6">
                                    {alert.data.name}
                                </Typography>
                                <Typography component="span" variant="caption">
                                    {alert.data.text}
                                </Typography>
                            </Box>
                        </ListItemButton>
                    )
                }
                onClose={handleCloseNotice}
            />
            <Snackbar
                open={calling.isCalling}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={10000}
                className={styles['alert_homePage']}
                message={
                    <ListItemButton sx={{ width: '100%', flex: 1 }}>
                        <Typography component="h5" variant="h6">
                            {calling?.name} đang gọi bạn
                        </Typography>
                        <IconButton onClick={() => handleAnswerCall('accept')}>
                            <PhoneInTalk />
                        </IconButton>
                        <IconButton onClick={() => handleAnswerCall('cancel')}>
                            <PhoneDisabled />
                        </IconButton>
                    </ListItemButton>
                }
            />
            <Snackbar
                open={notice.open}
                autoHideDuration={6000}
                onClose={handleCloseNotice}
                message={notice.text}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            />
        </Grid>
    ) : (
        <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
            <CircularProgress color="inherit" />
        </Backdrop>
    );
}

export default HomePage;
