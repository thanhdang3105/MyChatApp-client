import React from 'react';
import styles from '../scss/videoCall.module.scss';
import { DesktopAccessDisabled, DesktopMac, Mic, MicOff, PhoneDisabled } from '@mui/icons-material';
import { Avatar, Backdrop, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { currentRoomSelector } from '../redux/selector';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../provider/AuthProvider';

export default function VideoCall() {
    const currentRoom = useSelector(currentRoomSelector);
    const { socket, currentUser } = React.useContext(AuthContext);
    const { state: stateControls } = useLocation();
    const [status, setStatus] = React.useState('pending');
    const [localStream, setLocalStream] = React.useState(null);
    const [remoteStream, setRemoteStream] = React.useState(null);
    const [state, setState] = React.useState({
        audio: stateControls.audio,
        video: stateControls.video,
    });

    const configPeer = React.useMemo(() => {
        return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }, []);

    const peer = React.useRef(new RTCPeerConnection(configPeer));

    const navigate = useNavigate();

    React.useEffect(() => {
        if (status === 'disconnected' || !currentRoom._id || status === 'cancel') {
            navigate('/', { replace: true });
        }
    }, [status, currentRoom, navigate, localStream]);

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
                    socket.current.on('revice_answerCall', (response) => {
                        if (response === 'accept') {
                            setStatus('connecting');
                        } else {
                            stream.getTracks().forEach((track) => track.stop());
                            setStatus('cancel');
                        }
                    });
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
    }, [localStream, stateControls, currentUser, currentRoom, socket]);

    React.useEffect(() => {
        if (stateControls.type === 'offer' && localStream && status !== 'pending') {
            localStream.getTracks().forEach((track) => {
                try {
                    if (!peer.current.getSenders().find((sender) => sender.track.id === track.id)) {
                        peer.current.addTrack(track, localStream);
                    }
                } catch (er) {
                    console.log(er);
                }
            });

            peer.current.ontrack = (event) => {
                console.log(event);
                const [remote] = event.streams;
                setRemoteStream(remote);
            };

            peer.current.onicecandidate = (event) => {
                console.log(event);
                if (event.candidate) {
                    socket.current.emit('send_signal', { to: currentRoom.userId, signal: event.candidate });
                }
            };

            socket.current.on('revice_signal', async (signal) => {
                if (signal.type === 'answer' && !peer.current.currentRemoteDescription) {
                    const remoteDesc = new RTCSessionDescription(signal);
                    await peer.current.setRemoteDescription(remoteDesc);
                } else if (signal.candidate && peer.current.signalingState !== 'closed') {
                    try {
                        await peer.current.addIceCandidate(signal);
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            });

            (async function () {
                if (peer.current.signalingState !== 'closed') {
                    const offer = await peer.current.createOffer();
                    await peer.current.setLocalDescription(offer);
                    socket.current.emit('send_signal', { to: currentRoom.userId, signal: offer });
                }
            })();

            peer.current.addEventListener('connectionstatechange', (event) => {
                console.log(event);
                if (peer.current.connectionState === 'connected') {
                    setStatus('connected');
                } else if (event.currentTarget.iceConnectionState === 'disconnected') {
                    setStatus('disconnected');
                    localStream?.getTracks().forEach((track) => track.stop());
                    peer.current.close();
                }
            });
        }
    }, [configPeer, localStream, socket, status, stateControls, currentRoom]);

    React.useEffect(() => {
        if (stateControls.type === 'answer' && localStream) {
            socket.current.emit('answer_call', { id: currentRoom.userId, mess: 'accept' });

            localStream.getTracks().forEach((track) => {
                try {
                    if (!peer.current.getSenders().find((sender) => sender.track.id === track.id)) {
                        peer.current.addTrack(track, localStream);
                    }
                } catch (er) {
                    console.log(er);
                }
            });

            peer.current.ontrack = (event) => {
                console.log(event);
                const [remote] = event.streams;
                setRemoteStream(remote);
            };

            peer.current.onicecandidate = (event) => {
                console.log(event);
                if (event.candidate) {
                    socket.current.emit('send_signal', { to: currentRoom.userId, signal: event.candidate });
                }
            };

            socket.current.on('revice_signal', async (signal) => {
                if (signal.type === 'offer' && !peer.current.currentRemoteDescription) {
                    peer.current.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await peer.current.createAnswer();
                    await peer.current.setLocalDescription(answer);
                    socket.current.emit('send_signal', { to: currentRoom.userId, signal: answer });
                } else if (signal.candidate && peer.current.signalingState !== 'closed') {
                    try {
                        await peer.current.addIceCandidate(signal);
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            });

            peer.current.addEventListener('connectionstatechange', (event) => {
                console.log(event);
                if (peer.current.connectionState === 'connected') {
                    setStatus('connected');
                } else if (event.currentTarget.iceConnectionState === 'disconnected') {
                    setStatus('disconnected');
                    localStream?.getTracks().forEach((track) => track.stop());
                    peer.current.close();
                }
            });
        }
    }, [configPeer, localStream, socket, stateControls, currentRoom]);

    const handleLeaveCall = React.useCallback(() => {
        setStatus('disconnected');
        const localVideo = document.getElementById('localStream');
        const remoteVideo = document.getElementById('remoteStream');
        localStream.getTracks().forEach((track) => track.stop());
        localVideo?.removeAttribute('srcObjec');
        if (remoteVideo) {
            remoteStream?.getTracks().forEach((track) => track.stop());
            remoteVideo?.removeAttribute('srcObjec');
        }
        if (peer.current) {
            peer.current.close();
        }
    }, [localStream, remoteStream]);

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
        window.onbeforeunload = () => {
            handleLeaveCall();
        };
        return () => {
            window.onbeforeunload = null;
        };
    }, [status, remoteStream, handleLeaveCall]);

    const toggleButton = (newstate) => {
        const track = localStream.getTracks().find((track) => track.kind === newstate);
        if (track.enabled) {
            track.enabled = false;
        } else {
            track.enabled = true;
        }
        setState((prev) => ({ ...prev, [newstate]: !prev[newstate] }));
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
                    {status === 'disconnected'
                        ? 'Kết thúc'
                        : status === 'cancel'
                        ? 'Không nghe máy'
                        : status === 'pending'
                        ? 'Đang gọi'
                        : 'Đang kết nối'}
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
            {status === 'connected' && remoteStream ? (
                <div className={styles['video_container']}>
                    <video id="remoteStream" playsInline />
                    {/* <div className={styles['noCamera']}>
                            <Avatar src={currentRoom.photoURL}>
                                {currentRoom.photoURL || currentRoom.name.charAt(0).toLowerCase()}
                            </Avatar>
                            <Typography component="h4" variant="h5">
                                {currentRoom.name}
                            </Typography>
                        </div> */}
                </div>
            ) : (
                userInfo
            )}
        </div>
    );
}
