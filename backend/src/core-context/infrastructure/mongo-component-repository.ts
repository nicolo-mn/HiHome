import mongoose, { Schema, Document } from "mongoose";
import {
  HomeComponent,
  ComponentStatus,
  ComponentType,
} from "../domain/home-component";
import { ComponentRepository } from "../domain/component-repository";

interface ComponentDocument extends Document {
  homeId: string;
  name: string;
  type: ComponentType;
  status: ComponentStatus;
}

const componentSchema = new Schema<ComponentDocument>({
  homeId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["light", "window", "climatization"],
  },
  status: { type: Schema.Types.Mixed, required: true },
});

const ComponentModel = mongoose.model<ComponentDocument>(
  "Component",
  componentSchema,
);

export class MongoComponentRepository implements ComponentRepository {
  async findByHomeId(homeId: string): Promise<HomeComponent[]> {
    const docs = await ComponentModel.find({ homeId });
    return docs.map(
      (doc) =>
        new HomeComponent(
          doc._id.toString(),
          doc.homeId,
          doc.name,
          doc.type,
          doc.status,
        ),
    );
  }

  async updateStatus(
    componentId: string,
    homeId: string,
    status: ComponentStatus,
  ): Promise<HomeComponent | null> {
    const doc = await ComponentModel.findOneAndUpdate(
      { _id: componentId, homeId },
      { $set: { status } },
      { new: true },
    );
    if (!doc) return null;
    return new HomeComponent(
      doc._id.toString(),
      doc.homeId,
      doc.name,
      doc.type,
      doc.status,
    );
  }
}

export { ComponentModel };
