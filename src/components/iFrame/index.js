import React from 'react';
import PropTypes from 'prop-types';

const Index = ({ src }) => (
  <section id="championship-draft-page" data-b-layout="container" style={{
    height: '100%', width: '100%', padding: '0', margin: '0',
  }}>
    <div data-b-layout="row vpad">
      <iframe src={src} style={{
        margin: '0 auto', maxWidth: '1024px', height: '100vh', width: '100vw', border: 0,
      }} />
    </div>
  </section>
);

Index.propTypes = {
  src: PropTypes.string.isRequired,
};

export default Index;
