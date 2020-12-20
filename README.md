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
type RouteHandler = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, unknown, unknown>;

interface RouteConfig {
    pathParams: Paths.DeletePet.PathParameters; // { id: number }
    responses: Paths.DeletePet.Responses.Default;
    successResponses?: unknown;
    requestBody?: unknown;
    queryParams?: unknown;
    headers?: unknown;
}
```

## RouteHandler type
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

## RouteConfig type
The `RouteConfig` interface is more flexible, and can be used to add static type checking to both server and client implementations.

The fields of this type will be optional and `unknown` whenever they don't apply to that specific route. For example, the **DeletePet** route from the example above doesn't specify any query parameters, so the `queryParams` field is optional.

This interface has the following fields:
- `pathParams` is be an object with a field for each of the route's path parameters (e.g., for `/example/{id}`, could be an object with type `{id: number}`)
- `responses` is a union type with all valid responses for the route (both successes and failures)
- `sucessResponses` is also a union type, but only contains types for... success responses (there is typically only one of those).
- `requestBody` is the type of the request body
- `queryParams` is be an object with a field for each of the route's query parameters (e.g., for `/example?userId=123&company=abc`, could be an object with type `{userId: number, company: string}`)
- `headers` is an object with a field for each of the route's headers

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
