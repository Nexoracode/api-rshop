// // pipes/snake-to-camel.pipe.ts
// import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
// import * as camelcaseKeys from 'camelcase-keys';

// @Injectable()
// export class SnakeToCamelPipe implements PipeTransform {
//     transform(value: any, metadata: ArgumentMetadata) {
//         const { type } = metadata;
//         if (value && typeof value === 'object') {
//             if (['body', 'query', 'param'].includes(type)) {
//                 return camelcaseKeys(value, { deep: true });
//             }
//         }
//         return value;
//     }
// }
