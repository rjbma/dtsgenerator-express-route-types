# dtsgenerator-express-route-types

This is a `dtsgenerator` plugin for generating types for **Express** route handlers. 

For each route specified under the `Paths` namespace, this plugin will look for types (``PathParameters``, 
``Responses``, ``RequestBody`` and ``QueryParameters``) that are defined for that path, and use `any` for those 
types that can't be found.

For example, for a path like `DeletePet`:

```typescript
declare namespace Paths {
  ...
  namespace DeletePet {
      namespace Parameters {
          export type Id = number;
      }
      export interface PathParameters {
          id: Parameters.Id;
      }
      namespace Responses {
          export type Default = Components.Schemas.Error;
      }
  }
  ...
}
```

the pluging would would add the following type:

```typescript
type RouteHandler = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, any, any>;
```

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

# Development

```
npm run build
npm test
```

## Stacks

- TypeScript
- eslint
- prettier

## npm scripts

### main scripts

- `npm run build`: transpile this plugin. This command need before publishing this plugin.
- `npm test`: test this plugin with coverage.

### sub scripts

- `npm run watch`: watch editing files for compile.
- `npm run lint:fix`: fix lint error automatically.
- `npm run test:update-snapshot`: update snapshot files for unit test.
- `npm run coverage`: report to [coveralls](https://coveralls.io/). Need coveralls configuration file.
