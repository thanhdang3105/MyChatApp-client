import React from 'react';
import styles from '../../scss/authen.module.scss';
import { Box, TextField, Button, Typography, Modal, Fade, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ArrowBackTwoTone } from '@mui/icons-material';
import { AuthContext } from '../../provider/AuthProvider';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';

function Login({ setMethod }) {
    const { setCurrentUser } = React.useContext(AuthContext);
    const [loading, setLoading] = React.useState(false);
    const [isFogortPwd, setIsFogortPwd] = React.useState(false);
    const [isResetPWD, setIsResetPwd] = React.useState(false);
    const [validate, setValidate] = React.useState({ open: false, text: '', status: 'error' });
    const [validateForgotPWD, setValidateForgotPWD] = React.useState({ error: false, helperText: '' });
    const [emailCode, setEmailCode] = React.useState(null);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        setLoading(true);
        try {
            handleCloseErr();
            axios
                .post(process.env.REACT_APP_API_URI + '/api/users', {
                    action: 'login',
                    data: {
                        email: data.get('email'),
                        password: data.get('password'),
                        provider: 'email/pwd',
                    },
                })
                .then((response) => {
                    if (response.status === 200) {
                        localStorage.setItem('rememberId', response.data._id);
                        setCurrentUser(response.data);
                        navigate('/', { replace: true });
                        setLoading(false);
                    }
                })
                .catch(({ response: { data } }) => {
                    setValidate({ open: true, text: data.message, status: 'error' });
                    setLoading(false);
                });
        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    const handleFogortPWD = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setLoading(true);
        if (isResetPWD) {
            axios
                .post(process.env.REACT_APP_API_URI + '/api/users', {
                    action: 'resetPWD',
                    data: { code: data.get('codeCheck'), newPass: data.get('newPWD'), emailCode },
                })
                .then((res) => {
                    if (res.status === 200) {
                        setLoading(false);
                        setValidate({ open: true, text: 'Đổi mật khẩu thành công!', status: 'success' });
                        setIsResetPwd(false);
                        setEmailCode(null);
                        setIsFogortPwd(false);
                    }
                })
                .catch((err) => {
                    if (err.response?.status === 300) {
                        setLoading(false);
                        setValidateForgotPWD({ error: true, helperText: 'Mã xác thực không đúng!' });
                    } else if (err.response?.status === 301) {
                        setLoading(false);
                        setValidateForgotPWD({ error: true, helperText: 'Code hết hạn vui lòng bắt đầu lại!' });
                        setIsResetPwd(false);
                        setEmailCode(null);
                    } else {
                        setLoading(false);
                        setValidateForgotPWD({ error: true, helperText: 'Lỗi!' });
                        console.log(err);
                        // setEmailCode(null)
                    }
                });
            return;
        } else {
            axios
                .post(process.env.REACT_APP_API_URI + '/api/users', {
                    action: 'checkEmail',
                    data: data.get('checkEmail'),
                    id: uuidV4(),
                })
                .then((res) => {
                    if (res.status === 200) {
                        setLoading(false);
                        setValidate({ open: true, text: 'Vui lòng check mail của bạn!', status: 'info' });
                        setEmailCode(res.data);
                        setIsResetPwd(true);
                    }
                })
                .catch((err) => {
                    if (err.response?.status === 300) {
                        setLoading(false);
                        setValidateForgotPWD({ error: true, helperText: 'Tài khoản không tồn tại!' });
                    } else {
                        setLoading(false);
                        setValidateForgotPWD({ error: true, helperText: 'Lỗi!' });
                        console.log(err);
                    }
                });
        }
    };

    const handleCloseErr = () => {
        setValidate({ open: false, text: '', status: 'error' });
        setValidateForgotPWD({ error: false, helperText: '' });
        setLoading(false);
    };

    return (
        <>
            <Snackbar
                open={validate.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                autoHideDuration={6000}
                onClose={handleCloseErr}
            >
                <Alert severity={validate.status} sx={{ width: '100%' }}>
                    {validate.text}
                </Alert>
            </Snackbar>
            <Box component="form" onSubmit={handleSubmit} className={styles['wrapper_form']}>
                <Box>
                    <div className={styles['wrapper_heading']}>
                        <Button startIcon={<ArrowBackTwoTone />} onClick={() => setMethod('')}>
                            Trở lại
                        </Button>
                        <Button onClick={() => setMethod('register')}>Đăng ký</Button>
                    </div>
                    <Typography component="h1" variant="h4" className={styles['wrapper_heading-text']}>
                        Đăng nhập
                    </Typography>
                </Box>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    error={validate.open}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    title="Vui lòng nhập mật khẩu"
                    error={validate.open}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2, borderRadius: '15px' }}
                    disabled={loading}
                >
                    {loading && <CircularProgress color="secondary" size="20" />} Đăng nhập
                </Button>
                <Button className={styles['btn-link']} color="inherit" onClick={() => setIsFogortPwd(true)}>
                    Quên mật khẩu?
                </Button>
            </Box>
            <Modal
                open={isFogortPwd}
                onClose={() => setIsFogortPwd(false)}
                aria-labelledby="transition-modal-title"
                closeAfterTransition
            >
                <Fade in={isFogortPwd}>
                    <Box component="form" onSubmit={handleFogortPWD} className={styles['modal_fogortPWD']}>
                        <Typography id="transition-modal-title" variant="h6" component="h2">
                            Lấy lại mật khẩu
                        </Typography>
                        {!isResetPWD ? (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="checkEmail"
                                label="Nhập Mail của bạn"
                                type="email"
                                id="checkEmail"
                                onChange={() => setValidateForgotPWD({ error: false, helperText: '' })}
                                {...validateForgotPWD}
                            />
                        ) : (
                            <>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="codeCheck"
                                    label="Nhập mã xác thực..."
                                    type="text"
                                    {...validateForgotPWD}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="newPWD"
                                    label="Nhập mật khẩu mới..."
                                    type="password"
                                    onChange={() => setValidateForgotPWD({ error: false, helperText: '' })}
                                    {...validateForgotPWD}
                                />
                            </>
                        )}

                        <Button
                            type="submit"
                            startIcon={loading && <CircularProgress color="success" size={20} />}
                            variant="contained"
                        >
                            Xác nhận
                        </Button>
                    </Box>
                </Fade>
            </Modal>
        </>
    );
}

export default React.memo(Login);
