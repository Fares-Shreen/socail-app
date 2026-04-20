"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class baseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(date, options) {
        return await this.model.create(date);
    }
    async findAll() {
        return await this.model.find();
    }
    async findById(id) {
        return await this.model.findById(id);
    }
    async findOne({ filter, projection }) {
        return await this.model.findOne(filter, projection);
    }
    async find({ filter, projection, options }) {
        return await this.model.find(filter, projection)
            .skip(options?.skip || 0)
            .limit(options?.limit || 0)
            .sort(options?.sort || {})
            .populate(options?.populate);
    }
    async delete(filter) {
        return await this.model.findOneAndDelete(filter);
    }
    async findOneAndUpdate({ filter, update, options }) {
        return await this.model.findOneAndUpdate(filter, update, { returnDocument: 'after', ...options });
    }
}
exports.default = baseRepository;
