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
            successResponses: Paths.AddPet.Responses.$200;
            requestBody: Paths.AddPet.RequestBody;
            queryParams?: unknown;
            headers?: unknown;
        }
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
            successResponses?: unknown;
            requestBody?: unknown;
            queryParams?: unknown;
            headers?: unknown;
        }
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
            successResponses: Paths.FindPetById.Responses.$200;
            requestBody?: unknown;
            queryParams?: unknown;
            headers?: unknown;
        }
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
            successResponses: Paths.FindPets.Responses.$200;
            requestBody?: unknown;
            queryParams: Paths.FindPets.QueryParameters;
            headers?: unknown;
        }
    }
}
