# dtsgenerator-express-route-types

This is the `dtsgenerator` plugin.
This plugin's description is here.

# Install

```
npm install dtsgenerator-express-route-types
```

# Usage

`dtsgen.json`
```json
{
    "plugins": {
        "dtsgenerator-express-route-types": true, // or { config object }
    }
}
```

# Configuration

<!-- If this plugin uses the config object this section is useful for plugin user. -->

- the type of configuration
```
type Config = {
    map: {
        from: (string | boolean)[];
        to: string[];
    }[];
};
```

| key | type | description |
|-----|------|-------------|
| map | Array of object | the mapping of replacing. |
| map.*n*.from | `Array<string | boolean>` | the definition of from name. if this value is true, it treated as wildcard . |
| map.*n*.to | `Array<string | boolean>` | the definition of to name. |


- Example
```
{
  "map": [
    {
      "from": ["Components", "Schemas"],
      "to": ["Test", "PetStore"]
    },
    {
      "from": ["Paths"],
      "to": ["Test", "PetStore"]
    }
  ]
}
```


# Development

```
npm run build
npm test
```

## Stacks

- TypeScript
- eslint
- prettier

## Files

- `index.ts`: plugin main file
- `test/snapshot_test.ts`: test main file. should not edit this file.
- `test/post_snapshots/`: post process test patterns. Please add folder if you need.
- `test/pre_snapshots/`: pre process test patterns. Please add folder if you need.

## npm scripts

### main scripts

- `npm run build`: transpile this plugin. This command need before publishing this plugin.
- `npm test`: test this plugin with coverage.

### sub scripts

- `npm run watch`: watch editing files for compile.
- `npm run lint:fix`: fix lint error automatically.
- `npm run test:update-snapshot`: update snapshot files for unit test.
- `npm run coverage`: report to [coveralls](https://coveralls.io/). Need coveralls configuration file.
