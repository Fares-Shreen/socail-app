import {
    HydratedDocument, Model, PopulateOptions, ProjectionType, QueryFilter, QueryOptions, Types
    , UpdateQuery
} from "mongoose";

abstract class baseRepository<TDocument> {
    constructor(private readonly model: Model<TDocument>) { }
    async create(date: Partial<TDocument>, options?: QueryOptions): Promise<HydratedDocument<TDocument>> {
        return await this.model.create(date)
    }
    async findAll(): Promise<HydratedDocument<TDocument>[]> {
        return await this.model.find()
    }
    async findById(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findById(id)
    }
    async findOne({ filter, projection }: { filter: QueryFilter<TDocument>, projection?: ProjectionType<TDocument> }): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findOne(filter, projection)
    }
    async find({ filter, projection, options }: { filter: QueryFilter<TDocument>, projection?: ProjectionType<TDocument>, options?: QueryOptions }): Promise<HydratedDocument<TDocument>[]> {
        return await this.model.find(filter, projection)
        .skip(options?.skip || 0)
        .limit(options?.limit || 0)
        .sort(options?.sort || {})
        .populate(options?.populate as PopulateOptions)
    }
    async delete(filter: QueryFilter<TDocument>): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findOneAndDelete(filter)
    }

    async findOneAndUpdate({ filter, update , options}: { filter: QueryFilter<TDocument>, update: UpdateQuery<TDocument>, options?: QueryOptions }): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findOneAndUpdate(filter, update, { returnDocument: 'after',...options })
    }
    
    


}

export default baseRepository