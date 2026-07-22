import type { APIRoute } from 'astro'
import { buildGeoDataset, GEO_RELATIONS, GEO_SCHEMA_VERSION, jsonResponse, SITE_URL } from '../../lib/geoKnowledge'

export const prerender = true

export const GET: APIRoute = async () => {
  const dataset = await buildGeoDataset()
  return jsonResponse({
    schemaVersion: GEO_SCHEMA_VERSION,
    generatedAt: dataset.generatedAt,
    site: SITE_URL,
    relations: GEO_RELATIONS,
    nodeCount: dataset.graph.nodes.length,
    edgeCount: dataset.graph.edges.length,
    nodes: dataset.graph.nodes,
    edges: dataset.graph.edges,
  })
}
