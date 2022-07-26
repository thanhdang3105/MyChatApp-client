import { Grid } from '@mui/material';
import React from 'react';
import Authen from '../components/Authen';
import Login from '../components/Authen/Login';
import Register from '../components/Authen/Register';
import styles from '../scss/authen.module.scss';

function Authentication() {
    const [authMethod, setAuthMethod] = React.useState('');

    return (
        <Grid container className={`${styles['wrapper']} ${authMethod ? styles[authMethod] : ''}`}>
            <Grid item xs={12} className={styles['wrapper_login']}>
                <Login setMethod={setAuthMethod} />
            </Grid>
            <Grid item xs={12} className={styles['wrapper_authen']}>
                <Authen setMethod={setAuthMethod} />
            </Grid>
            <Grid item xs={12} className={styles['wrapper_register']}>
                <Register setMethod={setAuthMethod} />
            </Grid>
        </Grid>
    );
}

export default Authentication;
