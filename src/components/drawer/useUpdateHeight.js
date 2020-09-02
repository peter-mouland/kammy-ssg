import { useState, useLayoutEffect } from 'react';
import canUseDom from '@kammy/helpers.can-use-dom';

const useUpdateHeight = () => {
    const innerHeight = canUseDom() ? window.innerHeight : 0;
    const [height, setHeight] = useState(innerHeight);
    const setHeightToWindow = () => setHeight(innerHeight);

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
