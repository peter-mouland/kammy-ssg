import type React from 'react';

declare global {
    declare type SVGIcon = React.FC<React.SVGAttributes<SVGElement>>;
    declare type ValueOf<T> = T[keyof T];
}

