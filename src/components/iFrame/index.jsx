import * as React from 'react'
import PropTypes from 'prop-types';

const IFrame = ({ src, title }) => (
    <section
        id="championship-draft-page"
        data-b-layout="container"
        style={{
            height: '100%',
            width: '100%',
            padding: '0',
            margin: '0',
        }}
    >
        <div data-b-layout="row vpad">
            <iframe
                title={title}
                src={src}
                style={{
                    margin: '0 auto',
                    maxWidth: '1024px',
                    height: '100vh',
                    width: '100vw',
                    border: 0,
                }}
            />
        </div>
    </section>
);

IFrame.propTypes = {
    src: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
};

export default IFrame;
