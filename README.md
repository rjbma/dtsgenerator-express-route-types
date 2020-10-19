# dtsgenerator-express-route-types

This is a `dtsgenerator` plugin for generating types for **Express** route handlers. 

For each route specified under the `Paths` namespace, this plugin will look for types (``PathParameters``, 
``Responses``, ``RequestBody`` and ``QueryParameters``) that are defined for that path, and use `unknown` (or `any`) for those 
types that can't be found.

For example, for a path like `DeletePet` (note it doesn't defined types for query parameters and body payload):

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

and a config object like:

```json
{
    "placeholderType": "any",
    "routeTypeName": "RouteHandler",
}
```


the plugin would add the following types:

```typescript
type RouteHandler = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, any, any>;

interface RouteConfig {
    path: Paths.DeletePet.PathParameters;
    responses: Paths.DeletePet.Responses.Default;
    request?: unknown;
    query?: unknown;
    headers?: unknown;
}
```

The `RouteHandler` type can be used to add static type checking to a route's path parameters, query parameters, body payload, and responses. For example:

```typescript
const app = express(); // Invoke express to variable for use in application
const route: Paths.DeletePet.RouteHandler = (req, res, next) => {
  req.params.id; // OK. also, `id` is of type `number`
  req.params.name; // NOK, `name` is not a valid param
  res.status(500).json({ message: '33434' }); // OK
  res.status(500).json("something went wrong"); // NOK, `Components.Schemas.Error` does not allow a string
  // the same would happen with `req.query` and `req.body`
};
```

The `RouteConfig` interface is more flexible, and can be used to add static type checking to both server and client implementations.

# Install

```
npm install dtsgenerator-express-route-types
```

# Usage

The configuration object for the plugin takes two parameters:

- `placeholderType` specifies which type should be used when the type for some parameter isn't defined. Only `unknown` and `any` are supported
- `routeTypeName` specifies the name of the type that the plugin creates

`dtsgen.json`
```json
{
    "plugins": {
        "dtsgenerator-express-route-types": {
            "placeholderType": "unknown", // or "any"
            "routeTypeName": "Route", // whatever name you want for the express request handler type
        }
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
