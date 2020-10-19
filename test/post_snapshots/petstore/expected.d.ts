import { RequestHandler } from "express";
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
        interface Config {
            pathParams?: unknown;
            responses: Paths.AddPet.Responses.$200 | Paths.AddPet.Responses.Default;
            requestBody: Paths.AddPet.RequestBody;
            queryParams?: unknown;
            headers?: unknown;
        }
        type Route = RequestHandler<unknown, Paths.AddPet.Responses.$200 | Paths.AddPet.Responses.Default, Paths.AddPet.RequestBody, unknown>;
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
        interface Config {
            pathParams: Paths.DeletePet.PathParameters;
            responses: Paths.DeletePet.Responses.Default;
            requestBody?: unknown;
            queryParams?: unknown;
            headers?: unknown;
        }
        type Route = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, unknown, unknown>;
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
        interface Config {
            pathParams: Paths.FindPetById.PathParameters;
            responses: Paths.FindPetById.Responses.$200 | Paths.FindPetById.Responses.Default;
            requestBody?: unknown;
            queryParams?: unknown;
            headers?: unknown;
        }
        type Route = RequestHandler<Paths.FindPetById.PathParameters, Paths.FindPetById.Responses.$200 | Paths.FindPetById.Responses.Default, unknown, unknown>;
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
        interface Config {
            pathParams?: unknown;
            responses: Paths.FindPets.Responses.$200 | Paths.FindPets.Responses.Default;
            requestBody?: unknown;
            queryParams: Paths.FindPets.QueryParameters;
            headers?: unknown;
        }
        type Route = RequestHandler<unknown, Paths.FindPets.Responses.$200 | Paths.FindPets.Responses.Default, unknown, Paths.FindPets.QueryParameters>;
    }
}
