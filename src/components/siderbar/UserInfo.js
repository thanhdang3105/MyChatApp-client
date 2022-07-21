import React from 'react';
import styles from '../../scss/siderbar.module.scss';
import { ListItemAvatar, ListItemText, Avatar, Button, IconButton, ListItemButton } from '@mui/material';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { AuthContext } from '../../provider/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { HighlightOff } from '@mui/icons-material';
import { AppContext } from '../../provider/AppProvider';

function UserInfo() {
    const { currentUser, setCurrentUser, socket } = React.useContext(AuthContext);
    const { setIsVisibleMobileSider } = React.useContext(AppContext);
    const navigate = useNavigate();

    const handleSignOut = () => {
        socket.current.disconnect();
        signOut(auth);
        localStorage.removeItem('rememberId');
        setCurrentUser(null);
        navigate('/authentication', { replace: true });
    };

    const showLayoutAccount = () => {
        navigate('/account');
    };

    return (
        <div className={styles['wrapper_userInfo']}>
            <ListItemButton className={styles['wrapper_userInfo-user']} onClick={showLayoutAccount}>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={currentUser.photoURL}>
                        {currentUser.photoURL || currentUser.name?.charAt(0).toUpperCase()}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={currentUser.name} />
            </ListItemButton>
            <Button variant="outlined" color="error" size="small" onClick={handleSignOut}>
                Đăng xuất
            </Button>
            <IconButton className={styles['hiddenMobile_btn']} onClick={() => setIsVisibleMobileSider(false)}>
                <HighlightOff />
            </IconButton>
        </div>
    );
}

export default UserInfo;
