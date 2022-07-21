import { Container, Alert, IconButton, Box } from '@mui/material';
import React from 'react';
import styles from '../../scss/homePage.module.scss';
import Header from '../ChatWindow/Header';
import ChatWindow from '../ChatWindow';
import { useSelector } from 'react-redux';
import { currentRoomSelector } from '../../redux/selector';
import { List } from '@mui/icons-material';
import { AppContext } from '../../provider/AppProvider';

function Home() {
    const currentRoom = useSelector(currentRoomSelector);
    const { setIsVisibleMobileSider } = React.useContext(AppContext);

    return (
        <Container fixed className={styles['homePage_wrapper']}>
            {currentRoom?._id ? (
                <>
                    <Header />
                    <ChatWindow />
                </>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgb(229, 246, 253)' }}>
                    <IconButton
                        color="primary"
                        sx={{ height: 'fit-content' }}
                        className={styles['showMobile_btn']}
                        onClick={() => setIsVisibleMobileSider(true)}
                    >
                        <List />
                    </IconButton>
                    <Alert severity="info" sx={{ height: 64, alignItems: 'center', flex: 1 }}>
                        Chào mừng bạn đã đến với Message. Bạn chưa có phòng Chat nào!
                    </Alert>
                </Box>
            )}
        </Container>
    );
}

export default Home;
