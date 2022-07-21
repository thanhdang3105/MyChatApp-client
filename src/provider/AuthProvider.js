import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { currentRoomSlice } from '../redux/reducer/currentRoomSlice';
import { roomsSlice } from '../redux/reducer/roomsSlice';
import { usersSlice } from '../redux/reducer/usersSlice';

export const AuthContext = React.createContext();

function AuthProvider({ children }) {
    const socket = React.useRef(io(process.env.REACT_APP_API_URI));
    const [currentUser, setCurrentUser] = React.useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    React.useEffect(() => {
        if (currentUser && !socket.current.connected) {
            socket.current.connect();
        }
    }, [currentUser]);

    React.useEffect(() => {
        if (!currentUser) {
            if (localStorage.getItem('rememberId')) {
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/users', {
                        action: 'reLogin',
                        data: localStorage.getItem('rememberId'),
                    })
                    .then((response) => {
                        if (response.status === 200) {
                            setCurrentUser(response.data);
                            navigate('/', { replace: true });
                        } else {
                            navigate('/authentication', { replace: true });
                            setCurrentUser(null);
                        }
                    })
                    .catch((err) => {
                        if (err.response.status === 300) {
                            localStorage.removeItem('rememberId');
                        }
                        navigate('/authentication', { replace: true });
                        setCurrentUser(null);
                    });
                return;
            } else {
                navigate('/authentication', { replace: true });
            }
        }
    }, [navigate, currentUser]);

    React.useEffect(() => {
        if (currentUser?._id && socket.current) {
            axios
                .get(process.env.REACT_APP_API_URI + '/api/database?id=' + currentUser._id)
                .then((res) => {
                    if (res.status === 200) {
                        const { rooms, inboxs, users } = res.data;
                        inboxs.map((inbox) => {
                            socket.current?.emit('join_room', inbox._id);
                            return inbox;
                        });
                        rooms.map((room) => {
                            socket.current?.emit('join_room', room._id);
                            return room;
                        });
                        const roomsList = rooms.concat(inboxs);
                        roomsList.sort((a, b) => {
                            const tA = new Date(a.lastested).getTime();
                            const tB = new Date(b.lastested).getTime();
                            return tB - tA;
                        });
                        dispatch(currentRoomSlice.actions.setState(roomsList[0]));
                        dispatch(roomsSlice.actions.setState(roomsList));
                        dispatch(usersSlice.actions.setState(users));
                        socket.current?.emit('user_connect', currentUser._id);
                    }
                })
                .catch((err) => console.log(err));
        }
    }, [currentUser?._id, socket, dispatch]);

    return <AuthContext.Provider value={{ currentUser, setCurrentUser, socket }}>{children}</AuthContext.Provider>;
}

export default React.memo(AuthProvider);
