import { useState, useLayoutEffect } from 'react';
import canUseDom from '@kammy/helpers.can-use-dom';

const useUpdateHeight = () => {
    if (!canUseDom()) return { height: '0' };

    const [height, setHeight] = useState(window.innerHeight);
    const setHeightToWindow = () => setHeight(window.innerHeight);

    useLayoutEffect(() => {
        window.addEventListener('resize', setHeightToWindow);

        return () => {
            window.removeEventListener('resize', setHeightToWindow);
        };
    });

    return {
        height,
    };
};

export default useUpdateHeight;
