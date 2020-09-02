/* eslint-env jest */
import React from 'react';
import { render } from 'enzyme';

import NavBar from '.';

describe('<NavBar />', () => {
    it('renders a nav', () => {
        const wrapper = render(<NavBar />);
        expect(wrapper.find('nav')).toHaveLength(1);
    });
});
