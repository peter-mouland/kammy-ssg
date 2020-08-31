# `<Spacer />`

> A component to handle all our responsive spacing needs

## API

- `tag`: String
- `dataId`: String
- `all`: Object
- `small`: Object
- `phablet`: Object
- `medium`: Object
- `large`: Object
- `huge`: Object

### all, small, phablet, medium, large, huge

> Breakpoint's

Each _breakpoint_ is an object, the keys being spacing-type and the value the spacing-size

#### Spacing-Types

Each _spacing-type_ represents where the margin is to be applied:

- `vertical`: top and bottom
- `horizontal`: right and left
- `top`
- `right`
- `bottom`
- `left`
- `stack`: affects margin-top of the child components (not the first child)

#### Spacing-sizes:

Each _spacing-size_ is a 1:1 match for rainbow media-queries

- `spacings.MICRO`
- `spacings.TINY`
- `spacings.SMALL`
- `spacings.MEDIUM`
- `spacings.LARGE`
- `spacings.BIG`
- `spacings.HUGE`
- `spacings.SUPER`
- `spacings.JUMBO`

## Example

```jsx
<Spacer tag="span" all={{ bottom: spacings.MICRO }} medium={{ bottom: spacings.SMALL, right: spacings.SMALL }}>
  My Content
</Spacer>
```
