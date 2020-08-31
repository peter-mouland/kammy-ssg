# Accordion Component

> Accordion component used display content in a varity of different ways within a collapsable ui element.

```javascript
import Accordion from '@clearscore/rainbow.accordion';
import DesktopSvg from '@clearscore/rainbow.icons.device-desktop';

<Accordion
    icon={DesktopSvg}
    theme={Accordion.themes.SECONDARY}
    title="Title"
    description="Description"
>
    <Accordion.Content>
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
    </Accordion.Content>
</Accordion>
```
