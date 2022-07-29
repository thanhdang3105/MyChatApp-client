import { AddReaction } from '@mui/icons-material';
import { ClickAwayListener, IconButton, Popper } from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import React from 'react';

function EmojiComponent({ handle }) {
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    return (
        <>
            <Popper open={open} anchorEl={anchorEl} placement="top">
                <ClickAwayListener
                    onClickAway={() => {
                        setOpen((prev) => !prev);
                    }}
                >
                    <div>
                        <EmojiPicker onEmojiClick={handle} />
                    </div>
                </ClickAwayListener>
            </Popper>
            <IconButton
                onClick={(e) => {
                    setOpen((prev) => !prev);
                    !anchorEl && setAnchorEl(e.currentTarget);
                }}
            >
                <AddReaction sx={{ color: 'var(--text-color)' }} />
            </IconButton>
        </>
    );
}

export default EmojiComponent;
