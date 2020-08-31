# GridContainer component

The `GridContainer` should be used to help create a scalable layout wrapper for the sections of your pages. It is aligned with the same grid that the Design team design with, using 4, 8 and 12 columns for various breakpoints. It's a very simple component, that sets up the pre-defined paddings and column layouts at different breakpoints, and the content is yours to set up as you will. The idea is that the children included within the `GridContainer` will have their own `grid` css values applied to them, i.e. `grid-column-start` and `grid-column-end`.

```javascript
<GridContainer>
    <div className="aside">
        <div>
            You could place a fixed aside menu here.
        </div>
    </div>
    <div className="content">
        Place your content here.
    </div>
</GridContainer>
```

```css
.aside {
    grid-column-start: 3;
    grid-column-end: span 2;
    & > div {
        position: fixed;
    }
}

.content {
    grid-column-end: span 6;
}
```
