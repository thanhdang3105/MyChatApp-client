import React from 'react';
import UserInfo from '../siderbar/UserInfo';
import CollapseList from '../siderbar/CollapseList';
import { List } from '@mui/material';
import { InboxTwoTone } from '@mui/icons-material';
import { currentRoomSelector, roomsSelector } from '../../redux/selector';
import { useDispatch, useSelector } from 'react-redux';
import { doc, onSnapshot } from 'firebase/firestore';
import { fireStore } from '../../firebase/config';
import { AuthContext } from '../../provider/AuthProvider';
import { roomsSlice } from '../../redux/reducer/roomsSlice';
import { updateDocument } from '../../firebase/service';

const SiderBar = React.forwardRef((prop, ref) => {
    const { currentUser } = React.useContext(AuthContext);
    const currentRoom = useSelector(currentRoomSelector);
    const rooms = useSelector(roomsSelector);

    const dispatch = useDispatch();

    React.useEffect(() => {
        const notificationRef = doc(fireStore, 'notify', currentUser._id);
        onSnapshot(notificationRef, (doc) => {
            if (doc.data() && currentRoom._id) {
                const listNotify = doc.data().list;
                if (listNotify && listNotify.length) {
                    dispatch(
                        roomsSlice.actions.checkNotify({
                            id: currentUser._id,
                            notify: listNotify,
                            currentRoomId: currentRoom._id,
                        }),
                    );
                }
            }
        });
    }, [currentRoom, currentUser._id, dispatch]);

    return (
        <List ref={ref} sx={{ pt: 0 }}>
            <UserInfo />
            <CollapseList icon={<InboxTwoTone style={{ color: 'var(--text-color)' }} />} title="Inboxs" data={rooms} />
        </List>
    );
});

export default SiderBar;
