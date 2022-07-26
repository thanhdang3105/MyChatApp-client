import React from 'react';
import styles from '../../scss/modalListImgSwiper.module.scss';
import { Box, Fade, Modal, IconButton } from '@mui/material';
import { NavigateBeforeOutlined, NavigateNextOutlined, HighlightOff, FileDownloadOutlined } from '@mui/icons-material';
import axios from 'axios';

function ListImgSwiper({
    room,
    open: {
        openModalPreviewImg: { open, id },
        setOpenModalPreviewImg,
    },
}) {
    const [list, setList] = React.useState(null);
    const [idActive, setIdActive] = React.useState(id);

    React.useEffect(() => {
        const data = [];
        if (room._id) {
            room.messages
                .filter((message) => message.type === 'img')
                .map((message) => {
                    const formatList = message.text.map((img, index) => ({ id: message._id + '-' + index, img }));
                    data.unshift(...formatList);
                    return message;
                });
            if (data.length) {
                setList(data);
            } else {
                setList(null);
            }
        } else {
            setList(null);
        }
    }, [room]);

    React.useEffect(() => {
        if (open) {
            if (id) {
                setIdActive(id);
            } else if (!id && list && list[0]) {
                setIdActive(list[0].id);
            } else if (!id && !list) {
                setIdActive(null);
            }
        }
    }, [open, id, list]);

    React.useEffect(() => {
        if (idActive) {
            const listView = document.querySelector('ul.' + styles['modal_listImg-list']);
            const listThumb = document.querySelector('ul.' + styles['modal_listImg-thumb']);
            const itemView = document.querySelector(
                `li.${styles['modal_listImg-itemView']} img[alt="${idActive}"]`,
            )?.parentElement;
            const itemThumb = document.querySelector(
                `li.${styles['modal_listImg-itemThumb']} img[alt="${idActive}"]`,
            )?.parentElement;
            if (listView && listThumb && itemView && itemThumb) {
                itemThumb.classList.add(styles['active']);
                listView.scrollTo(itemView.offsetLeft - 30, 0);
                listThumb.scrollTo(itemThumb.offsetLeft - itemThumb.offsetWidth * 3, 0);
            }
        }
    }, [idActive]);

    const handleSlideImg = (action) => {
        const itemView = document.querySelector(
            `.${styles['modal_listImg-itemView']} img[alt="${idActive}"]`,
        )?.parentElement;
        const itemThumb = document.querySelector(`li.${styles['modal_listImg-itemThumb']}.${styles['active']}`);
        switch (action) {
            case 'prev':
                const prevItem = itemView.previousElementSibling;
                if (prevItem.tagName === 'LI') {
                    itemThumb && itemThumb.classList.remove(styles['active']);
                    setIdActive(prevItem.firstElementChild.alt);
                } else {
                    prevItem.disabled = true;
                }
                break;
            case 'next':
                const nextItem = itemView.nextElementSibling;
                if (nextItem.tagName === 'LI') {
                    itemThumb && itemThumb.classList.remove(styles['active']);
                    setIdActive(nextItem.firstElementChild.alt);
                } else {
                    nextItem.disabled = true;
                }
                break;
            default:
                throw new Error(`Invalid action ${action}`);
        }
    };

    const handleClickThumb = (idImg) => {
        const thumbActive = document.querySelector(`li.${styles['modal_listImg-itemThumb']}.${styles['active']}`);
        if (thumbActive && thumbActive.firstElementChild.alt !== idImg) {
            setIdActive(idImg);
            thumbActive?.classList.remove(styles['active']);
        }
    };

    const handleDownload = (e) => {
        const currentImg = document.querySelector(`li.${styles['modal_listImg-itemView']} img[alt="${idActive}"]`);
        if (currentImg) {
            const name = currentImg.src.split('?')[0].split('/').pop();
            try {
                axios({
                    url: currentImg.src,
                    method: 'get',
                    responseType: 'arraybuffer',
                })
                    .then((res) => {
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = name;
                        link.click();
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            } catch (err) {
                console.log(err);
            }
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                setOpenModalPreviewImg({ open: false, id: null });
            }}
            aria-labelledby="transition-modal-title"
            closeAfterTransition
        >
            <Fade in={open}>
                <Box className={styles['wrapper_modal-listImg']}>
                    <IconButton
                        style={
                            navigator.userAgent.match('iPhone')
                                ? { display: 'none' }
                                : { transform: 'translateX(-100%)' }
                        }
                        className={styles['btn_modalHeader']}
                        onClick={handleDownload}
                    >
                        <FileDownloadOutlined />
                    </IconButton>
                    <IconButton
                        className={styles['btn_modalHeader']}
                        onClick={() => setOpenModalPreviewImg({ open: false, id: null })}
                    >
                        <HighlightOff />
                    </IconButton>
                    {list && list.length ? (
                        <>
                            <ul className={styles['modal_listImg-list']}>
                                <IconButton
                                    className={styles['btn_navigate-right']}
                                    onClick={() => {
                                        handleSlideImg('prev');
                                    }}
                                >
                                    <NavigateBeforeOutlined />
                                </IconButton>
                                {list.map((item) => (
                                    <li key={item.id} className={`${styles['modal_listImg-itemView']}`}>
                                        <img src={item.img} srcSet={item.img} alt={item.id} loading="lazy" />
                                    </li>
                                ))}
                                <IconButton
                                    className={styles['btn_navigate-left']}
                                    onClick={() => {
                                        handleSlideImg('next');
                                    }}
                                >
                                    <NavigateNextOutlined />
                                </IconButton>
                            </ul>
                            <ul className={styles['modal_listImg-thumb']}>
                                {list.map((item) => (
                                    <li
                                        key={item.id}
                                        className={`${styles['modal_listImg-itemThumb']}`}
                                        onClick={() => handleClickThumb(item.id)}
                                    >
                                        <img src={item.img} srcSet={item.img} alt={item.id} loading="lazy" />
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div
                            style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-color)',
                            }}
                        >
                            Không có ảnh nào!
                        </div>
                    )}
                </Box>
            </Fade>
        </Modal>
    );
}

export default ListImgSwiper;
