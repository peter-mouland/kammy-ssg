# Drawer Component

> A configurable component which appears from an edge of the screen when triggered. An optional backdrop which covers the rest of the screen can be added to encourage users to interact with drawer content.
> The open/closed state of the drawer should be managed by its consumer.
> The drawer accepts any children and adapts to its width/height on large viewports but appears in max viewport width/height on small viewports. The orientation of drawer content should be configured within the children themselves.

```javascript
// To render a drawer that appears from the bottom
<Drawer placement={Drawer.placements.BOTTOM}>Content</Drawer>

// To toggle the appearance of drawer
const [isDrawerOpen, toggleDrawer] = useState(false);
<Button onClick={() => toggleDrawer(!isDrawerOpen)} />
<Drawer isOpen={isDrawerOpen}>Content</Drawer>

// To render drawer with a backdrop
<Drawer hasBackdrop>Content</Drawer>

// To render a non-closable drawer
<Drawer isCloseable={false}>Content</Drawer>

// To configure the drawer onClose action
<Drawer onClose={()=>{}}>Content</Drawer>

// Use the theme prop to adjust the colour of the close icon
// Note that the theme will not change the background colour of the children content
<Drawer theme={Drawer.themes.DARK} isCloseable>Content</Drawer>

```
