import { CreateHelperDto } from "../dto/create-helper.dto";
import { UpdateHelperDto } from "../dto/update-helper.dto";
import { HelperEntity } from "../entities/helper.entity";

export class HelperMapper {
    static toResponse(helper: HelperEntity) {
        return {
            id: helper.id,
            title: helper.title,
            description: helper.description,
            image: helper.image,
        };
    }
}