import * as React from 'react'
import canUseDom from '@kammy/helpers.can-use-dom';

const useUpdateHeight = () => {
    const innerHeight = canUseDom() ? window.innerHeight : 0;
    const [height, setHeight] = React.useState(innerHeight);
    const setHeightToWindow = () => setHeight(innerHeight);

    React.useLayoutEffect(() => {
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
