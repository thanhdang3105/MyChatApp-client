import React from 'react';
import styles from '../../scss/homePage.module.scss';
import { formatRelative } from 'date-fns/esm';
import { Avatar, Box, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

function ItemMsg({ message, currentUser }) {
    const formatDate = React.useCallback((createdAt) => {
        let formatedDate = '';
        if (createdAt) {
            const seconds = new Date(createdAt).getTime();
            formatedDate = formatRelative(new Date(seconds), new Date());

            formatedDate = formatedDate.charAt(0).toUpperCase() + formatedDate.slice(1);
        }
        return formatedDate;
    }, []);

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
                        <Typography className={styles['msg_content-wrapper--text']} component="span" variant="body">
                            {message.text}
                        </Typography>
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
