import { ProjectSchema, type ProjectDocument } from "./ProjectSchema";

export function migrate(project: unknown): ProjectDocument {
  return ProjectSchema.parse(project);
}
