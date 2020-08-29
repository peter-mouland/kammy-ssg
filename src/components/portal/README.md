# Portal Component

> Functionality wrapper for rendering children in a sibling node via React Portal. Common use cases are for rendering items that require a stacking context at the top app level to ensure children are rendered at the top of the stack: overlays, modals, trays, drawers etc. Note - this does not include and logic for conditional rendering, this should be done within the context the Portal is used in. If you require a portal placed at a specific place, please use `@clearscore/helpers.placed-portal`.

```javascript
<Portal>
  <div>Content</div>
</Portal>;
```
