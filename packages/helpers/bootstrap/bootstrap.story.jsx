import React from 'react';
import { storiesOf } from '@storybook/react';
import Colors from './stories/Colors.story';
import Layout from './stories/Layout.story';

import './src/bootstrap';

const stories = storiesOf('Bootstrap', module);

stories.add('Colors', () => (
  <Colors />
));

stories.add('Layout', () => (
  <Layout />
));
