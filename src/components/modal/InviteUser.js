import React from 'react';
import styles from '../../scss/modal.module.scss';
import axios from 'axios';
import { Modal, Box, Fade, ListItemButton, Typography, Button, TextField, Autocomplete, Avatar } from '@mui/material';
import { AuthContext } from '../../provider/AuthProvider';
import { useSelector, useDispatch } from 'react-redux';
import { currentRoomSelector, usersSelector } from '../../redux/selector';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { addDocument } from '../../firebase/service';

function InviteUser({ visibleModal: { isInvite, setIsInvite } }) {
    const { socket } = React.useContext(AuthContext);
    const currentRoom = useSelector(currentRoomSelector);
    const users = useSelector(usersSelector);
    const [searchUsers, setSearchUsers] = React.useState([]);
    const [userSelect, setUserSelect] = React.useState([]);

    const dispatch = useDispatch();

    const handleInviteUser = (e) => {
        e.preventDefault();
        axios
            .post(process.env.REACT_APP_API_URI + '/api/rooms', {
                action: 'update',
                data: { id: currentRoom._id, newUsers: userSelect.map((user) => user._id) },
            })
            .then((response) => {
                if (response.status === 200) {
                    const newMember = [...currentRoom.members, ...userSelect];
                    dispatch(currentRoomSlice.actions.updateState({ members: newMember }));
                    userSelect.map((user) => {
                        addDocument('notify', { userId: user._id, roomId: currentRoom._id });
                        socket.current.emit('addUser_room', {
                            to: user._id,
                            room: { ...currentRoom, members: newMember },
                        });
                        return user;
                    });
                    setIsInvite(false);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleSelectUser = (e, value) => {
        setUserSelect(value);
    };

    const handleSearchUser = (e) => {
        const value = e.target.value;
        if (!value) return setSearchUsers([]);
        const search = users.filter(
            (user) =>
                user.name.toLowerCase().includes(value.toLowerCase()) &&
                !currentRoom.members.map((member) => member._id).includes(user._id),
        );
        setSearchUsers(search);
    };

    return (
        <Modal
            open={isInvite}
            onClose={() => setIsInvite(false)}
            aria-labelledby="transition-modal-title"
            closeAfterTransition
        >
            <Fade in={isInvite}>
                <Box
                    component="form"
                    onSubmit={handleInviteUser}
                    className={styles['modal_wrapper']}
                    sx={{ width: '100%' }}
                >
                    <Typography id="transition-modal-title" variant="h6" component="h2">
                        Thêm bạn
                    </Typography>
                    <Autocomplete
                        multiple
                        limitTags={3}
                        autoHighlight
                        clearIcon={false}
                        id="multiple-limit-tags"
                        options={searchUsers}
                        getOptionLabel={(option) => option.name}
                        renderOption={(prop, option) =>
                            option && (
                                <ListItemButton sx={{ display: 'flex', alignItems: 'center' }} {...prop}>
                                    <Avatar src={option.photoURL}>
                                        {option.photoURL || option.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    {option.name}
                                </ListItemButton>
                            )
                        }
                        onChange={handleSelectUser}
                        renderInput={(params) => <TextField {...params} label="Tìm kiếm" onChange={handleSearchUser} />}
                        sx={{ width: '100%', m: '10px 0' }}
                    />
                    <Button type="submit" variant="contained">
                        Xác nhận
                    </Button>
                </Box>
            </Fade>
        </Modal>
    );
}

export default React.memo(InviteUser);
