import bpy
import json
import os
from collections import defaultdict, deque

def find_edge_chains(mesh):
    vert_coords = [v.co for v in mesh.vertices]
    edge_graph = defaultdict(list)

    for edge in mesh.edges:
        a, b = edge.vertices
        edge_graph[a].append((b, edge.index))
        edge_graph[b].append((a, edge.index))

    visited_edges = set()
    chains = []

    for edge in mesh.edges:
        if edge.index in visited_edges:
            continue

        v_start, v_next = edge.vertices
        chain = [v_start, v_next]
        visited_edges.add(edge.index)

        # Forward walk
        current, prev = v_next, v_start
        while True:
            neighbors = [n for n, ei in edge_graph[current] if ei not in visited_edges and n != prev]
            if not neighbors:
                break
            n = neighbors[0]
            for nb, ei in edge_graph[current]:
                if nb == n:
                    visited_edges.add(ei)
                    break
            chain.append(n)
            prev, current = current, n

        # Backward walk
        current, prev = v_start, v_next
        while True:
            neighbors = [n for n, ei in edge_graph[current] if ei not in visited_edges and n != prev]
            if not neighbors:
                break
            n = neighbors[0]
            for nb, ei in edge_graph[current]:
                if nb == n:
                    visited_edges.add(ei)
                    break
            chain.insert(0, n)
            prev, current = current, n

        # Convert to flat array
        coord_chain = []
        for idx in chain:
            v = vert_coords[idx]
            coord_chain.extend([v.x, v.z, -v.y])
        chains.append(coord_chain)

    return chains

# Only export objects with _outline suffix
edges_data = {}
for obj in bpy.context.selected_objects:
    if obj.type == 'MESH' and obj.name.endswith("_outline"):
        mesh = obj.data
        mesh.calc_loop_triangles()
        base_name = obj.name.removesuffix("_outline")
        edges_data[base_name] = find_edge_chains(mesh)

# Save to JSON
blend_filepath = bpy.data.filepath
output_path = "cylinder_outlines.json"
if blend_filepath:
    output_path = os.path.join(os.path.dirname(blend_filepath), output_path)
filepath = os.path.splitext(output_path)[0] + ".json"

try:
    with open(filepath, 'w') as f:
        json.dump(edges_data, f, indent=0)
    print(f"Exported outlines to {filepath}")
except Exception as e:
    print(f"Error writing file: {e}")
