import { RequestHandler } from "expression";
declare namespace Components {
    namespace Schemas {
        export interface Error {
            code: number; // int32
            message: string;
        }
        export interface NewPet {
            name: string;
            tag?: string;
        }
        export interface Pet {
            name: string;
            tag?: string;
            id: number; // int64
        }
    }
}
declare namespace Paths {
    namespace AddPet {
        export type RequestBody = Components.Schemas.NewPet;
        namespace Responses {
            export interface $200 {
            }
            export type Default = {};
        }
        type RouteHandler = RequestHandler<any, Paths.AddPet.Responses.$200 | Paths.AddPet.Responses.Default, Paths.AddPet.RequestBody, any>;
    }
    namespace DeletePet {
        namespace Parameters {
            export type Id = number; // int64
        }
        export interface PathParameters {
            id: Parameters.Id /* int64 */;
        }
        namespace Responses {
            export type Default = Components.Schemas.Error;
        }
        type RouteHandler = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, any, any>;
    }
    namespace FindPetById {
        namespace Parameters {
            export type Id = number; // int64
        }
        export interface PathParameters {
            id: Parameters.Id /* int64 */;
        }
        namespace Responses {
            export type $200 = Components.Schemas.Pet;
            export type Default = Components.Schemas.Error;
        }
        type RouteHandler = RequestHandler<Paths.FindPetById.PathParameters, Paths.FindPetById.Responses.$200 | Paths.FindPetById.Responses.Default, any, any>;
    }
    namespace FindPets {
        namespace Parameters {
            export type Limit = number; // int32
            export type Tags = string[];
        }
        export interface QueryParameters {
            tags?: Parameters.Tags;
            limit?: Parameters.Limit /* int32 */;
        }
        namespace Responses {
            export type $200 = Components.Schemas.Pet[];
            export type Default = Components.Schemas.Error;
        }
        type RouteHandler = RequestHandler<any, Paths.FindPets.Responses.$200 | Paths.FindPets.Responses.Default, any, Paths.FindPets.QueryParameters>;
    }
}
