import { useEffect, useState, useCallback } from 'react';

// eslint-disable-next-line
// Based off https://github.com/medialize/ally.js/blob/987c12c64c00d79a9c2c64cd20ed42e08425473b/src/selector/focusable.js
const FOCUSABLE_SELECTOR =
    '' +
    // Namespace problems of [xlink:href] explained in https://stackoverflow.com/a/23047888/515124
    // svg a[*|href] does not match in IE9, but since we're filtering
    // through is/focusable we can include all <a> from SVG
    'svg a,' +
    // may behave as 'svg, svg *,' in chrome as *every* svg element with a focus event listener is focusable
    // navigational elements
    'a[href],' +
    // validity determined by is/valid-area.js
    'area[href],' +
    // validity determined by is/disabled.js
    'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]),' +
    // browsing context containers
    'iframe, object, embed,' +
    // interactive content
    'keygen,' +
    'audio, audio[controls],' +
    'video, video[controls],' +
    'summary,' +
    // just grab first one
    '[tabindex],' +
    // editing hosts
    '[contenteditable]';

function useFocusTrap({ hasBackdrop, isBackdropShown, isOpen, containerRef, onKeyDown, rootId = 'root' }) {
    const [focusableElements, setFocusableElements] = useState([]);

    useEffect(() => {
        const root = document.getElementById(rootId);

        if (root && isOpen) {
            root['aria-hidden'] = true; // IE my old friend
            root.setAttribute('aria-hidden', true);
        }

        if (root && !isOpen) {
            root.removeAttribute('aria-hidden');
        }

        document.body.style.overflow = isBackdropShown ? 'hidden' : 'auto';

        const focusContainer = containerRef.current;
        const focusable = focusContainer.querySelectorAll(FOCUSABLE_SELECTOR);

        if (focusable.length > 0) {
            focusable[0].focus();
            // focusable is node list, convert to array
            setFocusableElements([...focusable]);
        }

        if (isOpen) {
            // IE and Edge <3
            focusContainer['aria-hidden'] = false;
            focusContainer['tab-index'] = null;

            focusContainer.removeAttribute('aria-hidden');
            focusContainer.removeAttribute('tab-index');
        } else {
            // IE and Edge <3
            focusContainer['aria-hidden'] = true;
            focusContainer['tab-index'] = -1;

            focusContainer.setAttribute('aria-hidden', true);
            focusContainer.setAttribute('tab-index', -1);
        }

        return () => {
            if (root) {
                focusContainer['aria-hidden'] = false;
                root.removeAttribute('aria-hidden');
            }

            document.body.style.overflow = 'auto';
        };
    }, [hasBackdrop, isBackdropShown, isOpen, containerRef, rootId]);

    const keyHandler = useCallback(
        (event) => {
            if (event.key === 'Tab' && focusableElements.length > 0) {
                const { length, 0: first, [length - 1]: last } = focusableElements;

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }

            onKeyDown(event);
        },
        [focusableElements, onKeyDown],
    );

    return keyHandler;
}

export default useFocusTrap;
