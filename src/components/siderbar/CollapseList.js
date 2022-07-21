import React from 'react';
import styles from '../../scss/siderbar.module.scss';
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListItemAvatar,
    Collapse,
    Avatar,
    Input,
    Box,
    Popper,
    Button,
    ClickAwayListener,
    Badge,
} from '@mui/material';
import { Add, ExpandLess, ExpandMore } from '@mui/icons-material';
import AddRoom from '../modal/AddRoom';
import { AppContext } from '../../provider/AppProvider';
import { usersSelector } from '../../redux/selector';
import { useSelector } from 'react-redux';

function CollapseList({ icon, title, active = true, data }) {
    const users = useSelector(usersSelector);

    const { chooseRoom } = React.useContext(AppContext);
    const [open, setOpen] = React.useState(active);
    const [isAddRoom, setIsAddRoom] = React.useState(false);
    const [dataSearch, setDataSearch] = React.useState([]);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [inputValue, setInputValue] = React.useState('');
    const id = React.useId();

    const handleClick = () => {
        setOpen((prev) => !prev);
    };

    const handleSearch = (e) => {
        setAnchorEl(e.target);
        const value = e.target.value;
        setInputValue(value);
        if (value) {
            const search = data.filter((data) => data.name.toLowerCase().includes(value.toLowerCase()));
            const searchUser = users?.filter((data) => data.name.toLowerCase().includes(value.toLowerCase()));
            const valueSearch = searchUser.filter((item) => {
                return !search.map((user) => user.userId).includes(item._id);
            });
            setDataSearch(valueSearch.concat(search));
        } else {
            setDataSearch([]);
        }
    };

    const handleClosePoper = () => {
        setDataSearch([]);
    };

    const handleChooseRoom = (room) => {
        chooseRoom(room);
        setInputValue('');
        setDataSearch([]);
        handleClosePoper();
    };

    return (
        <>
            <ListItemButton onClick={handleClick} className={styles['collapseList_heading']}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={title} />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClosePoper}>
                    <Box className={styles['collapseList_input-wrapper']}>
                        <Input
                            className={styles['collapseList_input']}
                            aria-describedby={id}
                            variant="contained"
                            value={inputValue}
                            onChange={handleSearch}
                            onClick={handleSearch}
                            placeholder="Search..."
                        />
                        <Popper
                            id={id}
                            open={Boolean(dataSearch.length)}
                            className={styles['collapseList_popper']}
                            anchorEl={anchorEl}
                        >
                            <Box className={styles['collapseList_popper-box']}>
                                {dataSearch.map((item, key) => (
                                    <ListItemButton
                                        className={styles['collapseList_list-item']}
                                        key={key}
                                        onClick={() => handleChooseRoom(item)}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                color={item.online ? 'success' : 'primary'}
                                                overlap="circular"
                                                variant="dot"
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'right',
                                                }}
                                            >
                                                <Avatar alt="Avatar" src={item.photoURL}>
                                                    {item.photoURL ? '' : item.name?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText primary={item.name} />
                                    </ListItemButton>
                                ))}
                            </Box>
                        </Popper>
                    </Box>
                </ClickAwayListener>
                <List component="div" disablePadding className={styles['collapseList_list']}>
                    {data &&
                        data.map((item, key) => (
                            <Badge
                                key={key}
                                color={'warning'}
                                overlap="circular"
                                invisible={!item.new}
                                variant="dot"
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                className={styles['collapseList_list--notifi']}
                            >
                                <ListItemButton
                                    className={`${styles['collapseList_list-item']} ${item.new && styles['isNewMess']}`}
                                    onClick={() => handleChooseRoom(item)}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            color={item.online ? 'success' : 'primary'}
                                            overlap="circular"
                                            variant="dot"
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                        >
                                            <Avatar alt="Avatar" src={item.photoURL}>
                                                {item.photoURL ? '' : item.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        className={styles['collapseList_list-item--name']}
                                        primary={item.name}
                                    />
                                </ListItemButton>
                            </Badge>
                        ))}
                    <Button size="small" startIcon={<Add />} onClick={() => setIsAddRoom(true)}>
                        Thêm phòng
                    </Button>
                    <AddRoom visible={{ isAddRoom, setIsAddRoom }} />
                </List>
            </Collapse>
        </>
    );
}

export default CollapseList;
