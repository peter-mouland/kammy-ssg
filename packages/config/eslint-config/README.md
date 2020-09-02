# eslint

> Storing eslint config as a module so it can be shared across repos

## Usage

The default config that is exported contains all common rules, plugins, and overrides.

There is also a config that is exported for any repositories using react, which extends the base config with some extra react specific config and plugins.

## Config

Add a `.eslintrc.json` file at the root of your project containing the following:

```json
// base config
{
    "extends": "@kammy/eslint-config"
}

// React config
{
    "extends": "@kammy/eslint-config/react"
}

// Lambda config
{
    "extends": "@kammy/eslint-config/lambda"
}
```
