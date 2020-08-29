import { useState, useLayoutEffect } from 'react';

const useUpdateHeight = () => {
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
