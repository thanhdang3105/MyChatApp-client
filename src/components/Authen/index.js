import React from 'react';
import axios from 'axios';
import styles from '../../scss/authen.module.scss';
import { FacebookAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Box, Container, Avatar, Typography, Button, Grid } from '@mui/material';
import { EmailTwoTone, Google, FacebookTwoTone } from '@mui/icons-material';
import { auth } from '../../firebase/config';
import { AuthContext } from '../../provider/AuthProvider';
import { useNavigate } from 'react-router-dom';

function Authen({ setMethod }) {
    const { setCurrentUser } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const newUser = React.useCallback((user, _tokenResponse, providerId) => {
        return {
            password: user.uid,
            name: user.displayName,
            email: _tokenResponse.email || user.uid,
            photoURL: user.photoURL,
            createdAt: user.reloadUserInfo.createdAt,
            provider: providerId,
        };
    }, []);

    const handleLoginUser = React.useCallback(
        (userCredential) => {
            const { user, _tokenResponse, providerId } = userCredential;
            if (_tokenResponse.isNewUser) {
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/users', {
                        action: 'create',
                        data: newUser(user, _tokenResponse, providerId),
                    })
                    .then((response) => {
                        if (response.status === 200) {
                            localStorage.setItem('rememberId', response.data._id);
                            setCurrentUser(response.data);
                            navigate('/', { replace: true });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            } else {
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/users', {
                        action: 'login',
                        data: { email: _tokenResponse.email || user.uid, provider: providerId },
                    })
                    .then((response) => {
                        if (response.status === 200) {
                            localStorage.setItem('rememberId', response.data._id);
                            setCurrentUser(response.data);
                            navigate('/', { replace: true });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        },
        [newUser, setCurrentUser, navigate],
    );

    const handleClickMethod = (method) => {
        switch (method) {
            case 'login':
                setMethod(method);
                break;
            case 'register':
                setMethod(method);
                break;
            case 'google':
                try {
                    const GoogleAuth = new GoogleAuthProvider();
                    signInWithPopup(auth, GoogleAuth)
                        .then((userCredential) => {
                            handleLoginUser(userCredential);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } catch (e) {
                    console.log(e);
                }
                break;
            case 'facebook':
                try {
                    signInWithPopup(auth, new FacebookAuthProvider())
                        .then((userCredential) => {
                            handleLoginUser(userCredential);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } catch (e) {
                    console.log(e);
                }
                break;
            default:
                throw new Error('Invalid method: ' + method);
        }
    };

    return (
        <Container component="main" maxWidth="xs" className={styles['wrapper_authen-container']}>
            <Box className={styles['authen_container-box']}>
                <Avatar
                    src={process.env.PUBLIC_URL + '/img/logo.png'}
                    sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}
                />
                <Typography component="h1" variant="h5" sx={{ mb: 5 }}>
                    Đăng nhập vào Messages
                </Typography>
                <Box className={styles['box_authen-method']}>
                    <Button
                        fullWidth
                        variant="outlined"
                        className={styles['btn_authen-method']}
                        onClick={() => handleClickMethod('login')}
                    >
                        <EmailTwoTone /> Tài khoản / Mật khẩu
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        className={styles['btn_authen-method']}
                        onClick={() => handleClickMethod('google')}
                    >
                        <Google />
                        Đăng nhập bằng Google
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        className={styles['btn_authen-method']}
                        onClick={() => handleClickMethod('facebook')}
                    >
                        <FacebookTwoTone />
                        Đăng nhập bằng Facebook
                    </Button>
                    <Grid container direction="column">
                        <Grid item xs>
                            Bạn chưa có tài khoản?
                        </Grid>
                        <Button className={styles['btn-link']} onClick={() => handleClickMethod('register')}>
                            Đăng ký
                        </Button>
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
}

export default Authen;
