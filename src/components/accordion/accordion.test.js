import React from 'react';
import Text from '@clearscore/rainbow.text';

import Accordion from '.';

const props = {
    title: 'Title',
    children: 'Some content',
};

describe('Accordion component', () => {
    it('should render with string title', () => {
        const title = 'hey';
        const wrapper = mount(<Accordion {...props} title={title} />);
        expect(wrapper.find('[data-qa="accordion-title"]')).toHaveText(title);
    });

    it('should render with description', () => {
        const description = 'Description';
        const wrapper = mount(<Accordion {...props} description={description} />);
        expect(wrapper.find(Text.Body2)).toHaveText(description);
    });

    it('should render with node description', () => {
        const description = <div>Description</div>;
        const wrapper = shallow(<Accordion {...props} description={description} />);

        expect(wrapper.find(Text.Body2).props().children).toEqual(description);
    });

    it('should render with a dataQa', () => {
        const wrapper = shallow(<Accordion {...props} />);
        expect(wrapper).toHaveProp('data-qa', 'accordion');
    });

    it('should render with an optional dataId', () => {
        const wrapper = shallow(<Accordion {...props} dataId="some-test-id" />);
        expect(wrapper).toHaveProp('data-id', 'some-test-id');
    });

    it('shouldn\'t render with tertiary title value when no tertiary title is provided', () => {
        const description = '';
        const wrapper = shallow(<Accordion {...props} description={description} />);
        expect(wrapper.find(Text.Body2)).toHaveLength(0);
    });

    it('should render with icon', () => {
        const Icon = () => <img alt="img" />;
        const wrapper = shallow(<Accordion {...props} icon={Icon} />);
        expect(wrapper.find('.icon')).toExist();
    });

    it('should render with a chevron icon', () => {
        const wrapper = shallow(<Accordion {...props} />);
        expect(wrapper.find('.chevron')).toExist();
    });

    it('should render as expanded when [data-qa="accordion-toggle"] is clicked', () => {
        const wrapper = mount(<Accordion {...props} />);
        expect(wrapper.find('[data-qa="accordion-content"]')).toHaveProp('hidden', true);
        wrapper.find('[data-qa="accordion-toggle"]').simulate('click');
        expect(wrapper.find('[data-qa="accordion-content"]')).toHaveProp('hidden', false);
    });

    it('should render as collapsed when [data-qa="accordion-toggle"] is clicked a second time', () => {
        const wrapper = mount(<Accordion {...props} />);
        wrapper.find('[data-qa="accordion-toggle"]').simulate('click');
        expect(wrapper.find('[data-qa="accordion-content"]')).toHaveProp('hidden', false);
        wrapper.find('[data-qa="accordion-toggle"]').simulate('click');
        expect(wrapper.find('[data-qa="accordion-content"]')).toHaveProp('hidden', true);
    });

    it('should render with the primary type by default', () => {
        const wrapper = shallow(<Accordion {...props} />);
        expect(wrapper).toHaveClassName('isTypePrimary');
    });

    it('should render with the passed type', () => {
        const wrapper = shallow(<Accordion {...props} type={Accordion.types.SECONDARY} />);
        expect(wrapper).toHaveClassName('isTypeSecondary');
    });

    it('should render with the isDisabled class when disabled', () => {
        const wrapper = shallow(<Accordion {...props} isDisabled />);
        expect(wrapper.find('[data-qa="accordion-toggle"]')).toHaveClassName('isDisabled');
    });

    it('should render without a chevron icon when disabled', () => {
        const wrapper = shallow(<Accordion {...props} isDisabled />);
        expect(wrapper.find('.chevron')).not.toExist();
    });

    it('should render with accordion already expanded if isInitialExpanded is passed', () => {
        const wrapper = shallow(<Accordion {...props} isInitialExpanded />);
        expect(wrapper.find('[data-qa="accordion-content"]')).toHaveProp('hidden', false);
    });

    it('should call the passed onToggle function when the accordion is toggled', () => {
        const onToggleStub = jest.fn();
        const wrapper = shallow(<Accordion {...props} onToggle={onToggleStub} />);
        wrapper.find('[data-qa="accordion-toggle"]').simulate('click');
        expect(onToggleStub).toHaveBeenCalledWith({ isExpanded: true });
        wrapper.find('[data-qa="accordion-toggle"]').simulate('click');
        expect(onToggleStub).toHaveBeenCalledWith({ isExpanded: false });
    });
});
