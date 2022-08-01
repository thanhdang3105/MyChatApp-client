import React from 'react';
import styles from '../../scss/homePage.module.scss';
import {
    AppBar,
    Avatar,
    AvatarGroup,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Menu,
    MenuItem,
    Snackbar,
    Tooltip,
} from '@mui/material';
import { MoreVert, List as IconList, Videocam } from '@mui/icons-material';
import { AuthContext } from '../../provider/AuthProvider';
import axios from 'axios';
import { AppContext } from '../../provider/AppProvider';
import InviteUser from '../modal/InviteUser';
import SettingModal from '../modal/SettingModal';
import SwitchTheme from '../customComponents/SwitchTheme';
import { useSelector, useDispatch } from 'react-redux';
import { currentRoomSelector, roomsSelector } from '../../redux/selector';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { useNavigate } from 'react-router-dom';

function Header() {
    const currentRoom = useSelector(currentRoomSelector);
    const rooms = useSelector(roomsSelector);
    const { currentUser, socket } = React.useContext(AuthContext);
    const { setIsVisibleMobileSider } = React.useContext(AppContext);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [themeDark, setThemeDark] = React.useState(() => {
        const boolean = JSON.parse(localStorage.getItem('themeDark'));
        document.body.classList.toggle('dark', boolean);
        return boolean;
    });
    const [openMenu, setOpenMenu] = React.useState(false);
    const [isInvite, setIsInvite] = React.useState(false);
    const [isSetting, setIsSetting] = React.useState(false);
    const [err, setErr] = React.useState({ err: false, text: '' });
    const id = React.useId();

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const toggleMenuSetting = (e) => {
        setOpenMenu((prev) => !prev);
        setAnchorEl(e.target);
    };

    const handleChangeTheme = React.useCallback((e) => {
        localStorage.setItem('themeDark', e.target.checked);
        setThemeDark(e.target.checked);
        document.body.classList.toggle('dark', e.target.checked);
    }, []);
    const handleOutRoom = () => {
        axios
            .post(process.env.REACT_APP_API_URI + '/api/rooms', {
                action: 'outRoom',
                data: { id: currentRoom._id, userId: currentUser._id },
            })
            .then((response) => {
                if (response.status === 200) {
                    const newRooms = rooms.filter((room) => room._id !== currentRoom._id);
                    dispatch(roomsSlice.actions.setState(newRooms));
                    dispatch(currentRoomSlice.actions.setState(newRooms[0]));
                    setOpenMenu(false);
                    setErr({ err: false, text: '' });
                    socket.current.emit('out_room', { room: currentRoom._id, userId: currentUser._id });
                }
            })
            .catch(({ response }) => {
                if (response.status === 300) {
                    const newRooms = rooms.filter((room) => room._id !== currentRoom._id);
                    dispatch(roomsSlice.actions.setState(newRooms));
                    dispatch(currentRoomSlice.actions.setState(newRooms[0]));
                    setOpenMenu(false);
                    setErr({ err: false, text: '' });
                } else {
                    setErr({ err: true, text: 'Xảy ra lỗi' });
                }
            });
    };

    return (
        <AppBar component="nav" position="relative" className={styles['homPage_header-appbar']}>
            <Toolbar className={styles['homPage_header-toolbar']}>
                <Box className={styles['homPage_header-box']}>
                    <IconButton className={styles['showMobile_btn']} onClick={() => setIsVisibleMobileSider(true)}>
                        <IconList />
                    </IconButton>
                    <Avatar alt="Avatar" src={currentRoom.photoURL} sx={{ border: '1px solid #999' }}>
                        {currentRoom.photoURL ? '' : currentRoom.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box className={styles['homPage_header-title--box']}>
                        <Typography variant="h5" component="h4">
                            {currentRoom.name}
                        </Typography>
                        <Typography variant="caption" component="span" className={styles['homPage_header-title-desc']}>
                            {currentRoom.description || (currentRoom.online && 'Đang hoạt động')}
                        </Typography>
                    </Box>
                </Box>
                <Box className={styles['homPage_header-box']}>
                    <SwitchTheme onClick={handleChangeTheme} checked={themeDark} />
                    {currentRoom.members ? (
                        <AvatarGroup max={3} className={styles['homPage_header-avatar']}>
                            {currentRoom.members.map((item) => (
                                <Tooltip key={item._id} title={item.name}>
                                    <Avatar sx={{ width: 24, height: 24 }} src={item?.photoURL}>
                                        {item?.photoURL || item?.name?.charAt(0)?.toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            ))}
                        </AvatarGroup>
                    ) : (
                        !currentRoom.provider && (
                            <IconButton
                                color="inherit"
                                onClick={() =>
                                    navigate('/videoCall', { state: { audio: true, video: true, type: 'offer' } })
                                }
                            >
                                <Videocam />
                            </IconButton>
                        )
                    )}
                    {!currentRoom.provider && (
                        <>
                            <IconButton
                                id="basic-button"
                                aria-controls={openMenu ? id : undefined}
                                aria-haspopup="true"
                                aria-expanded={openMenu ? 'true' : undefined}
                                onClick={toggleMenuSetting}
                            >
                                <MoreVert style={{ color: 'var(--text-color)' }} />
                            </IconButton>
                            <Menu
                                id={id}
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={toggleMenuSetting}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        setOpenMenu(false);
                                        setIsSetting(true);
                                    }}
                                >
                                    Thông tin
                                </MenuItem>
                                {currentRoom.members && (
                                    <MenuItem
                                        onClick={() => {
                                            setOpenMenu(false);
                                            setIsInvite(true);
                                        }}
                                    >
                                        Thêm thành viên
                                    </MenuItem>
                                )}
                                {currentRoom.members && <MenuItem onClick={handleOutRoom}>Thoát phòng</MenuItem>}
                            </Menu>
                            <InviteUser visibleModal={{ isInvite, setIsInvite }} />
                            <SettingModal visibleModal={{ isSetting, setIsSetting }} info={currentRoom} />
                        </>
                    )}
                </Box>
            </Toolbar>
            <Snackbar open={err.err} autoHideDuration={6000} message={err.text} />
        </AppBar>
    );
}

export default React.memo(Header);
