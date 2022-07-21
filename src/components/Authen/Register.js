import React from 'react';
import axios from 'axios';
import styles from '../../scss/authen.module.scss';
import { Box, Typography, Grid, TextField, Button, Snackbar, Alert } from '@mui/material';
import { ArrowBackTwoTone } from '@mui/icons-material';
import { AuthContext } from '../../provider/AuthProvider';
import { useNavigate } from 'react-router-dom';

function Register({ setMethod }) {
    const { setCurrentUser } = React.useContext(AuthContext);
    const [validate, setValidate] = React.useState({ err: false, text: '' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const password = data.get('password');
        if (!password.match('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{6,}')) {
            setValidate({ err: true, text: 'Mật khẩu tối thiểu 6 chữ số và bao gồm it nhất 1 chữ in hoa và 1 số' });
        } else if (password !== data.get('check_password')) {
            setValidate({ err: true, text: 'Mật khẩu không khớp!' });
        } else {
            handleCloseErr();
            try {
                axios
                    .post(process.env.REACT_APP_API_URI + '/api/users', {
                        action: 'register',
                        data: {
                            name: data.get('name'),
                            email: data.get('email'),
                            password,
                            createdAt: Date.now(),
                        },
                    })
                    .then((response) => {
                        if (response.status === 200) {
                            localStorage.setItem('rememberId', response.data._id);
                            setCurrentUser(response.data);
                            navigate('/', { replace: true });
                        }
                    })
                    .catch(({ response: { data } }) => setValidate({ err: true, text: data.message }));
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleCloseErr = () => {
        setValidate({ err: false, text: '' });
    };

    return (
        <Box className={styles['wrapper_form']}>
            <Box>
                <div className={styles['wrapper_heading']}>
                    <Button startIcon={<ArrowBackTwoTone />} onClick={() => setMethod('')}>
                        Trở lại
                    </Button>
                    <Button onClick={() => setMethod('login')}>Đăng nhập</Button>
                </div>
                <Typography component="h1" variant="h4" className={styles['wrapper_heading-text']}>
                    Đăng ký
                </Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            autoComplete="given-name"
                            name="name"
                            required
                            fullWidth
                            id="name"
                            label="Họ tên"
                            autoFocus
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField required fullWidth label="Địa chỉ Mail" name="email" autoComplete="email" />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            name="password"
                            label="Mật khẩu"
                            type="password"
                            autoComplete="new-password"
                            helperText="Tối thiểu 6 kí tự bao gồm ít nhất 1 chữ viết hoa và 1 số!"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            name="check_password"
                            label="Nhập lại mật khẩu"
                            type="password"
                            autoComplete="check-password"
                        />
                    </Grid>
                </Grid>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2, borderRadius: 'var(--border-radius)' }}
                >
                    Đăng ký
                </Button>
                <Snackbar
                    open={validate.err}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    autoHideDuration={6000}
                    onClose={handleCloseErr}
                >
                    <Alert severity="error" sx={{ width: '100%' }}>
                        {validate.text}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}

export default React.memo(Register);
