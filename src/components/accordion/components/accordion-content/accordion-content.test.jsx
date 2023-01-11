import React from 'react';
import { shallow } from 'enzyme';

import AccordionContent from '.';

const props = {
    children: 'Some content',
};

describe('AccordionContent component', () => {
    it('should render with the passed children', () => {
        const wrapper = shallow(<AccordionContent {...props} />);
        expect(wrapper).toHaveText(props.children);
    });
});
