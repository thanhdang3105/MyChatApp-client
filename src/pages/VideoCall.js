import React from 'react';
import styles from '../scss/videoCall.module.scss';
import {
    CancelPresentationSharp,
    CastSharp,
    DesktopAccessDisabled,
    DesktopMac,
    Mic,
    MicOff,
    PhoneDisabled,
} from '@mui/icons-material';
import { Avatar, Backdrop, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { currentRoomSelector } from '../redux/selector';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../provider/AuthProvider';
import Peer from 'simple-peer';

import * as process from 'process';

window.global = window;
window.process = process;
window.Buffer = [];

export default function VideoCall() {
    const currentRoom = useSelector(currentRoomSelector);
    const { socket, currentUser } = React.useContext(AuthContext);
    const { state: stateControls } = useLocation();
    const [status, setStatus] = React.useState('pending');
    const [localPeer, setLocalPeer] = React.useState(null);
    const [localStream, setLocalStream] = React.useState(null);
    const [remoteStream, setRemoteStream] = React.useState(null);
    const [state, setState] = React.useState({
        audio: stateControls.audio,
        video: stateControls.video,
    });

    const navigate = useNavigate();

    React.useEffect(() => {
        if (status === 'disconnected' || !currentRoom._id) {
            navigate('/', { replace: true });
        }
    }, [status, currentRoom]);

    React.useEffect(() => {
        const localStream = document.getElementById('localStream').parentElement;

        localStream.ontouchstart = localStream.onmousedown = (event) => {
            const top = localStream.offsetTop;
            const right = window.innerWidth - (localStream.offsetWidth + localStream.offsetLeft);
            const beginX = event.clientX;
            const beginY = event.clientY;
            localStream.ontouchmove = localStream.onmousemove = (e) => {
                let moveX = beginX - e.clientX + right;
                let moveY = e.clientY - beginY + top;
                localStream.style.right = moveX + 'px';
                localStream.style.top = moveY + 'px';
                if (moveX <= 0) {
                    localStream.style.right = '15px';
                } else if (localStream.offsetLeft <= 15) {
                    localStream.style.right = `calc(100% - ${localStream.offsetWidth + 15}px)`;
                }
                if (moveY <= 0) {
                    localStream.style.top = '15px';
                } else if (moveY >= window.innerHeight - localStream.offsetHeight) {
                    localStream.style.top = `calc(100% - ${localStream.offsetHeight + 15}px)`;
                }
            };
        };

        localStream.ontouchend = localStream.onmouseup = () => {
            localStream.ontouchmove = localStream.onmousemove = null;
        };

        localStream.ontouchcancel = localStream.onmouseleave = () => {
            localStream.ontouchmove = localStream.onmousemove = null;
        };

        return () => {
            localStream.ontouchstart = localStream.onmousedown = null;
            localStream.ontouchend = localStream.onmouseup = null;
            localStream.ontouchcancel = localStream.onmouseleave = null;
        };
    }, []);

    React.useEffect(() => {
        if (!localStream) {
            const mediaConfig = { audio: stateControls.audio, video: stateControls.video };
            navigator.mediaDevices
                .getUserMedia(mediaConfig)
                .then((stream) => {
                    setLocalStream(stream);
                    document.getElementById('localStream').srcObject = stream;
                    if (stateControls.type === 'offer') {
                        socket.current.emit('calling_user', {
                            to: currentRoom.userId,
                            from: currentUser._id,
                            name: currentUser.name,
                        });
                    }
                })
                .catch((err) => console.log(err));
        }
        socket.current.on('revice_answerCall', (response) => {
            if (response === 'accept') {
                setStatus('connecting');
            } else {
                setStatus('disconnected');
            }
        });
    }, [localStream, stateControls]);

    React.useEffect(() => {
        if (stateControls.type === 'answer' && localStream) {
            socket.current.emit('answer_call', { id: stateControls.id, mess: 'accept' });
            try {
                let peer = new Peer({ stream: localStream });
                setLocalPeer(peer);
                peer.on('signal', (data) => {
                    socket.current.emit('send_answer', { to: stateControls.id, answer: data });
                });

                socket.current.on('revice_offer', (offer) => {
                    if (!peer.destroyed) {
                        if (peer.connected && offer.type !== 'answer') {
                            peer.signal(offer);
                        } else if (!peer.connected) {
                            peer.signal(offer);
                        }
                    }
                });

                peer.on('stream', (stream) => {
                    setRemoteStream(stream);
                });

                peer.on('close', () => {
                    peer.destroy('leavecall');
                    navigate('/', { replace: true });
                });

                peer.on('error', (err) => {
                    console.log(err);
                    peer = new Peer({ stream: localStream });
                });

                peer.on('connect', () => {
                    setStatus('connected');
                });
            } catch (e) {
                console.log(e);
            }
        }
    }, [stateControls, localStream]);

    React.useEffect(() => {
        if (stateControls.type === 'offer' && localStream && status === 'connecting') {
            try {
                let peer = new Peer({ initiator: true, stream: localStream });
                setLocalPeer(peer);
                peer.on('signal', (data) => {
                    socket.current.emit('send_offer', { to: currentRoom.userId, offer: data });
                });

                socket.current.on('revice_answer', (answer) => {
                    if (!peer.destroyed) {
                        if (peer.connected && answer.type !== 'answer') {
                            peer.signal(answer);
                        } else if (!peer.connected) {
                            peer.signal(answer);
                        }
                    }
                });

                peer.on('stream', (stream) => {
                    setRemoteStream(stream);
                });

                peer.on('close', () => {
                    peer.destroy('leavecall');
                    navigate('/', { replace: true });
                });
                peer.on('error', (err) => {
                    console.log(err);
                    peer = new Peer({ initiator: true, stream: localStream });
                });

                peer.on('connect', () => {
                    setStatus('connected');
                });
            } catch (e) {
                console.log(e);
            }
        }
    }, [status, localStream, stateControls]);

    React.useEffect(() => {
        if (status === 'connected' && remoteStream) {
            const remoteVideo = document.getElementById('remoteStream');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
                remoteVideo.onloadedmetadata = () => {
                    remoteVideo.play();
                };
                remoteVideo.onerror = (e) => {
                    console.log('Remote stream err: ' + e);
                };
            }
        }
    }, [status, remoteStream]);

    const toggleButton = (newstate) => {
        const track = localStream.getTracks().find((track) => track.kind === newstate);
        if (track.enabled) {
            track.enabled = false;
        } else {
            track.enabled = true;
        }
        setState((prev) => ({ ...prev, [newstate]: !prev[newstate] }));
    };

    const handleLeaveCall = () => {
        const localStream = document.getElementById('localStream');
        const remoteStream = document.getElementById('remoteStream');
        localStream.srcObject.getTracks().forEach((track) => track.stop());
        localStream.removeAttribute('src');
        if (localPeer) {
            localPeer.destroy('leavecall');
            setLocalPeer(null);
            remoteStream?.srcObject?.getTracks().forEach((track) => track.stop());
            remoteStream?.removeAttribute('src');
            remoteStream?.removeAttribute('srcObjec');
        }
        setStatus('disconnected');
    };

    const userInfo = React.useMemo(() => {
        return currentRoom ? (
            <Box component="div" className={styles['waitting_accept']}>
                <Avatar src={currentRoom.photoURL}>
                    {currentRoom.photoURL || currentRoom.name.charAt(0).toLowerCase()}
                </Avatar>
                <Typography component="h4" variant="h5">
                    {currentRoom.name}
                </Typography>
                <Typography component="label" variant="caption">
                    {status === 'disconnected' ? 'Không nghe máy' : status === 'pending' ? 'Đang gọi' : 'Đang kết nối'}
                </Typography>
            </Box>
        ) : (
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }, [currentRoom, status]);

    return (
        <div className={styles['wrapper']}>
            {localStream && (
                <div className={styles['list_controls']}>
                    <IconButton onClick={() => toggleButton('video')}>
                        {state.video ? <DesktopMac /> : <DesktopAccessDisabled />}
                    </IconButton>
                    <IconButton onClick={() => toggleButton('audio')}>{state.audio ? <Mic /> : <MicOff />}</IconButton>
                    <IconButton onClick={handleLeaveCall}>
                        <PhoneDisabled />
                    </IconButton>
                </div>
            )}
            <div className={styles['video_local']} style={state.video ? {} : { display: 'none' }}>
                <video id="localStream" playsInline autoPlay />
            </div>
            {status === 'connected' ? (
                <div className={styles['video_container']}>
                    <video id="remoteStream" playsInline />
                </div>
            ) : (
                userInfo
            )}
        </div>
    );
}
