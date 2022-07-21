import React from 'react';
import styles from '../scss/accountCentral.module.scss';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import { ArrowBack, Close, DownloadDone, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../provider/AuthProvider';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import axios from 'axios';

function AccountCentral() {
    const { currentUser, setCurrentUser, socket } = React.useContext(AuthContext);
    const [fileAvatar, setFileAvatar] = React.useState(null);
    const [newAvatar, setNewAvatar] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [isEditName, setIsEditName] = React.useState(false);
    const [isChangePWD, setIsChangePWD] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [backName, setBackName] = React.useState('');
    const [validate, setvalidate] = React.useState({ error: false, helperText: '' });
    const [alert, setAlert] = React.useState({ open: false, text: '' });
    const navigate = useNavigate();
    const id = React.useId();

    const handleChangeAvatar = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setFileAvatar(file);
                setNewAvatar(reader.result);
            };
            reader.onerror = () => {
                setNewAvatar(null);
                setFileAvatar(null);
                // setNotice({ open: true, text: 'Tải ảnh thất bại!' });
            };
        } else {
            setNewAvatar(null);
            setFileAvatar(null);
        }
    };

    const handleSetAvatar = async () => {
        setLoading(true);
        const imgRef = await uploadBytes(ref(storage, fileAvatar.name), fileAvatar);
        const url = await getDownloadURL(imgRef.ref);
        if (url) {
            setNewAvatar(null);
            setFileAvatar(null);
            axios
                .post(process.env.REACT_APP_API_URI + '/api/users', {
                    action: 'update',
                    data: { id: currentUser._id, dataUpdate: { photoURL: url } },
                })
                .then((res) => {
                    if (res.status === 200) {
                        setCurrentUser((prev) => {
                            const newUser = { ...prev, photoURL: url };
                            socket.current.emit('userChangeInfo', newUser);
                            return newUser;
                        });
                        setAlert({ open: true, text: 'Đổi ảnh thành công' });
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (isEditName) {
            document.getElementById(id).focus();
        }
    }, [isEditName, id]);

    const handleEditName = () => {
        const name = document.getElementById(id).innerText;
        if (name) {
            setLoading(true);
            if (name !== backName) {
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/users', {
                        action: 'update',
                        data: { id: currentUser._id, dataUpdate: { name } },
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            setCurrentUser((prev) => {
                                const newUser = { ...prev, name };
                                socket.current.emit('userChangeInfo', newUser);
                                return newUser;
                            });
                            setAlert({ open: true, text: 'Đã đổi tên thành công' });
                            setLoading(false);
                            setIsEditName(false);
                            setBackName('');
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        setLoading(false);
                    });
            } else {
                setLoading(false);
                setIsEditName(false);
                setBackName('');
            }
        } else {
            alert('Không thể để trống tên!');
        }
    };

    const handleToggleShowPWD = () => {
        setShowPassword((prev) => !prev);
    };

    const handleChangePWD = (e) => {
        const currentPWD = document.querySelector('input[name="current_password"]');
        const newPWD = document.querySelector('input[name="new_password"]');
        const checkPWD = document.querySelector('input[name="check_password"]');
        e.preventDefault();
        if (newPWD.value !== checkPWD.value) {
            setvalidate({ error: true, helperText: 'Mật khẩu không khớp!' });
        } else if (currentPWD.value === newPWD.value) {
            setvalidate({ error: true, helperText: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
        } else {
            setLoading(true);
            axios
                .post(process.env.REACT_APP_API_URI + '/api/users', {
                    action: 'changePWD',
                    data: { id: currentUser._id, old: currentPWD.value, new: newPWD.value },
                })
                .then((res) => {
                    if (res.status === 200) {
                        setLoading(false);
                        currentPWD.value = '';
                        newPWD.value = '';
                        checkPWD.value = '';
                        setAlert({ open: true, text: 'Đổi mật khẩu thành công' });
                        setIsChangePWD(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setLoading(false);
                    if (err.response.status === 300) {
                        setvalidate({ error: true, helperText: 'Mật khẩu không đúng!' });
                    } else {
                        setvalidate({ error: true, helperText: 'Lỗi không xác định!' });
                    }
                });
        }
    };

    const handleChangeInput = () => {
        setvalidate({ error: false, helperText: '' });
    };

    const handleCloseNotice = () => {
        setAlert({ open: false, text: '' });
    };

    return (
        currentUser && (
            <Box component="div" className={styles['accountCentral_wrapper']}>
                <Snackbar
                    open={alert.open}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    autoHideDuration={6000}
                    onClose={handleCloseNotice}
                >
                    <Alert onClose={handleCloseNotice} severity="success" sx={{ width: 'fit-content' }}>
                        {alert.text}
                    </Alert>
                </Snackbar>
                <Typography component="h1" variant="h3" className={styles['accountCentral_wrapper-heading']}>
                    <Button className={styles['btn_arrow-back']} onClick={() => navigate('/')}>
                        <ArrowBack />
                    </Button>
                    Thông tin tài khoản
                </Typography>
                <Button sx={{ borderRadius: 999, p: 0 }} component="label">
                    <input hidden accept="image/*" type="file" onChange={handleChangeAvatar} />
                    <Avatar
                        alt="Avatar"
                        className={styles['accountCentral_wrapper-avatar']}
                        src={newAvatar || currentUser.photoURL}
                    >
                        {currentUser.photoURL || currentUser.name.charAt(0).toUpperCase()}
                    </Avatar>
                </Button>
                {newAvatar && fileAvatar && (
                    <Button
                        startIcon={loading && <CircularProgress size="25" />}
                        disabled={loading}
                        variant="outlined"
                        onClick={handleSetAvatar}
                    >
                        Đổi
                    </Button>
                )}
                <Box component="div" className={styles['accountCentral_wrapper-name']}>
                    <h2 id={id} contentEditable={isEditName}>
                        {currentUser.name}
                    </h2>
                    {isEditName ? (
                        <>
                            {loading ? <CircularProgress size={25} /> : <DownloadDone onClick={handleEditName} />}
                            <Close
                                onClick={() => {
                                    document.getElementById(id).innerText = backName;
                                    setIsEditName(false);
                                    setBackName('');
                                }}
                            />
                        </>
                    ) : (
                        <Edit
                            onClick={() => {
                                const saveName = document.getElementById(id).innerText;
                                setBackName(saveName);
                                setIsEditName(true);
                            }}
                        />
                    )}
                </Box>
                {currentUser.provider === 'email/pwd' && (
                    <Button variant="outlined" onClick={() => setIsChangePWD((prev) => !prev)}>
                        {isChangePWD ? 'Huỷ' : 'Đổi mật khẩu'}
                    </Button>
                )}
                {isChangePWD && (
                    <Box component="form" onSubmit={handleChangePWD} className={styles['accountCentral_wrapper-form']}>
                        <FormControl variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-password">Mật khẩu cũ...</InputLabel>
                            <Input
                                name="current_password"
                                required
                                id="outlined-adornment-passwor"
                                type={showPassword ? 'text' : 'password'}
                                onChange={handleChangeInput}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleToggleShowPWD}
                                            onMouseDown={handleToggleShowPWD}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <TextField
                            name="new_password"
                            required
                            label="Mật khẩu mới..."
                            type="password"
                            onChange={handleChangeInput}
                        />
                        <TextField
                            name="check_password"
                            {...validate}
                            onChange={handleChangeInput}
                            required
                            label="Nhập lại mật khẩu..."
                            type="password"
                        />
                        <Button type="submit" variant="contained" startIcon={loading && <CircularProgress size={25} />}>
                            Cập nhật
                        </Button>
                    </Box>
                )}
            </Box>
        )
    );
}

export default AccountCentral;
