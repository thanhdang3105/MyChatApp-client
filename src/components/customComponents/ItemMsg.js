import React from 'react';
import styles from '../../scss/homePage.module.scss';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { currentRoomSlice } from '../../redux/reducer/currentRoomSlice';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { AuthContext } from '../../provider/AuthProvider';
import { formatRelative } from 'date-fns/esm';
import { Avatar, Box, ListItem, ListItemAvatar, ListItemText, Menu, MenuItem, Typography } from '@mui/material';

function ItemMsg({ message, isPreview }) {
    const { socket, currentUser } = React.useContext(AuthContext);
    const [contextMenu, setContextMenu] = React.useState(null);
    const dispatch = useDispatch();
    const regexp = React.useRef(
        new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi),
    );
    const formatDate = React.useCallback((createdAt) => {
        let formatedDate = '';
        if (createdAt) {
            const seconds = new Date(createdAt).getTime();
            formatedDate = formatRelative(new Date(seconds), new Date());

            formatedDate = formatedDate.charAt(0).toUpperCase() + formatedDate.slice(1);
        }
        return formatedDate;
    }, []);

    const handleContextMenu = (event) => {
        event.preventDefault();
        setContextMenu((prev) =>
            prev === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                  }
                : null,
        );
    };

    const handleClose = () => {
        setContextMenu(null);
    };

    const handleItemContextMenu = (e) => {
        if (e.currentTarget.innerText === 'Sao chép') {
            navigator.clipboard.writeText(message.text);
        } else if (e.currentTarget.innerText === 'Thu hồi') {
            axios
                .post(process.env.REACT_APP_API_URI + '/api/messages', { action: 'remove', data: message._id })
                .then(() => {
                    dispatch(currentRoomSlice.actions.removeMsg({ idRoom: message.foreignId, idMsg: message._id }));
                    dispatch(roomsSlice.actions.removeMsg({ idRoom: message.foreignId, idMsg: message._id }));
                    socket.current.emit('removeMsg', { to: message.foreignId, data: message._id });
                })
                .catch((err) => console.log(err));
        }
        handleClose();
    };

    return (
        <ListItem
            className={`${styles['chatwindow_msg']} ${
                message.userId === currentUser._id && styles['chatwindow_msg--me']
            }`}
        >
            <ListItemAvatar className={styles['chatwindow_msg-avatar']}>
                <Avatar alt="Remy Sharp" src={message.photoURL}>
                    {message.photoURL || message.name.charAt(0).toUpperCase()}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                className={styles['chatwindow_msg-content']}
                primary={
                    <Box component="span">
                        <Typography variant="h7" component="h4" className={styles['chatwindow_msg-name']}>
                            {message.name}
                        </Typography>
                    </Box>
                }
                secondary={
                    <Box component="span" className={styles['msg_content-wrapper']}>
                        {message.type === 'img' ? (
                            <span className={styles['msg_content-wrapper--listImg']}>
                                {message.text.map((item, index) => {
                                    const id = message._id + '-' + index;
                                    return (
                                        <span
                                            key={index}
                                            className={styles['msg_content-wrapper--itemImg']}
                                            onClick={() => {
                                                isPreview({ open: true, id });
                                            }}
                                        >
                                            <img src={item} srcSet={item} alt={id} loading="lazy" />
                                        </span>
                                    );
                                })}
                            </span>
                        ) : (
                            <Typography
                                onContextMenu={handleContextMenu}
                                className={styles['msg_content-wrapper--text']}
                                component="span"
                                variant="body"
                            >
                                <Menu
                                    open={contextMenu !== null}
                                    onClose={handleClose}
                                    anchorReference="anchorPosition"
                                    anchorPosition={
                                        contextMenu !== null
                                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                            : undefined
                                    }
                                >
                                    <MenuItem onClick={handleItemContextMenu}>Sao chép</MenuItem>
                                    <MenuItem onClick={handleItemContextMenu}>Thu hồi</MenuItem>
                                </Menu>
                                {message.removed ? (
                                    'Đã thu hồi'
                                ) : regexp.current.test(message.text) ? (
                                    <a
                                        target="_blank"
                                        rel="noreferrer"
                                        href={
                                            message.text.includes('http://') || message.text.includes('https://')
                                                ? message.text
                                                : 'https://' + message.text
                                        }
                                        style={{ color: 'var(--text-color)' }}
                                    >
                                        {message.text}
                                    </a>
                                ) : (
                                    message.text
                                )}
                            </Typography>
                        )}
                        <Typography variant="caption" component="label">
                            {formatDate(message.createdAt)}
                        </Typography>
                    </Box>
                }
            />
        </ListItem>
    );
}

export default React.memo(ItemMsg);
