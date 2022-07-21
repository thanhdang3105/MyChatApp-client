import React from 'react';
import axios from 'axios';
import styles from '../../scss/modal.module.scss';
import { Button, Modal, TextField, Typography, Fade, Box } from '@mui/material';
import { AuthContext } from '../../provider/AuthProvider';
import { AppContext } from '../../provider/AppProvider';
import { useDispatch } from 'react-redux';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';

function AddRoom({ visible: { isAddRoom, setIsAddRoom } }) {
    const { currentUser } = React.useContext(AuthContext);
    const { setNotice } = React.useContext(AppContext);
    const dispatch = useDispatch();

    const handleAddRoom = React.useCallback(
        (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            axios
                .post(process.env.REACT_APP_API_URI + '/api/rooms', {
                    action: 'create',
                    data: {
                        name: data.get('name'),
                        description: data.get('description'),
                        members: [currentUser._id],
                    },
                })
                .then((response) => {
                    if (response.status === 200) {
                        dispatch(roomsSlice.actions.addRoom({ ...response.data, messages: [] }));
                        dispatch(currentRoomSlice.actions.setState({ ...response.data, messages: [] }));
                        setIsAddRoom(false);
                        setNotice({ open: true, text: 'Tạo thành công' });
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        },
        [dispatch, currentUser, setIsAddRoom, setNotice],
    );

    return (
        <Modal
            open={isAddRoom}
            onClose={() => setIsAddRoom(false)}
            aria-labelledby="transition-modal-title"
            closeAfterTransition
        >
            <Fade in={isAddRoom}>
                <Box component="form" onSubmit={handleAddRoom} className={styles['modal_wrapper']}>
                    <Typography id="transition-modal-title" variant="h6" component="h2">
                        Tạo phòng
                    </Typography>
                    <>
                        <TextField margin="normal" required fullWidth name="name" label="Tên phòng" type="text" />
                        <TextField margin="normal" fullWidth name="description" label="Mô tả" type="text" />
                    </>
                    <Box>
                        <Button type="submit" variant="contained">
                            Xác nhận
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}

export default React.memo(AddRoom);
