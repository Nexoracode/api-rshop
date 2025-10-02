import { PipeTransform, Injectable } from '@nestjs/common';

export type ParsedAttributeFilter = Record<number, number[]>;

@Injectable()
export class AttributeFilterPipe implements PipeTransform {
    transform(query: any): any {
        const raw = query['filter[attributes]'] || query.attributes;
        if (!raw) return query;

        const parsed: ParsedAttributeFilter = {};
        for (const group of raw.split('|')) {
            const [aid, vals] = group.split(':');
            if (!aid || !vals) continue;
            parsed[+aid] = vals.split(',').map((v) => +v).filter(Boolean);
        }

        query._parsedAttributes = parsed;
        return query;
    }

}
