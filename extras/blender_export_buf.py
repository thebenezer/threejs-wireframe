import bpy
import bmesh
import json
import os
from mathutils import Vector

def export_buf_format(filepath, context):
    """
    Export selected mesh to .buf (Buffer Geometry) format
    Preserves quad topology for wireframe rendering
    """
    
    # Get the active object
    obj = context.active_object
    
    if not obj or obj.type != 'MESH':
        raise Exception("Please select a mesh object")
    
    # Create a new bmesh instance from the mesh
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    
    # Ensure face indices are valid
    bm.faces.ensure_lookup_table()
    bm.verts.ensure_lookup_table()
    
    # Check if we should use flat shading (separate vertices per face)
    # This is better for wireframe rendering as it preserves face boundaries
    use_flat_shading = True  # Default to flat shading for better wireframe results
    
    # Prepare data structures
    vertices = []
    faces = []
    normals = []
    uvs = []
    vertex_index = 0
    
    # Extract faces and create separate vertices per face for flat shading
    face_data = []
    
    for face in bm.faces:
        face_verts = []
        
        # For each vertex in the face, add it as a separate vertex
        for loop in face.loops:
            vert = loop.vert
            
            # Transform to world coordinates
            world_pos = obj.matrix_world @ vert.co
            vertices.extend([world_pos.x, world_pos.y, world_pos.z])
            
            # Use face normal (flat shading) instead of vertex normal
            if use_flat_shading:
                world_normal = obj.matrix_world.to_3x3().normalized() @ face.normal
            else:
                world_normal = obj.matrix_world.to_3x3().normalized() @ vert.normal
            normals.extend([world_normal.x, world_normal.y, world_normal.z])
            
            # Add UV if available
            uv_layer = bm.loops.layers.uv.active
            if uv_layer:
                uv = loop[uv_layer].uv
                uvs.extend([uv.x, uv.y])
            else:
                uvs.extend([0.0, 0.0])
            
            face_verts.append(vertex_index)
            vertex_index += 1
        
        # Create face info
        face_info = {
            "vertices": face_verts,
            "type": "quad" if len(face_verts) == 4 else "triangle"
        }
        face_data.append(face_info)
    
    # Create the .buf format data
    buf_data = {
        "format": "buf",
        "version": "1.0",
        "metadata": {
            "generator": "Blender BUF Exporter",
            "object_name": obj.name,
            "vertex_count": vertex_index,
            "face_count": len(bm.faces),
            "quad_count": sum(1 for f in face_data if f["type"] == "quad"),
            "triangle_count": sum(1 for f in face_data if f["type"] == "triangle"),
            "shading": "flat" if use_flat_shading else "smooth"
        },
        "attributes": {
            "position": {
                "array": vertices,
                "itemSize": 3,
                "count": vertex_index
            },
            "normal": {
                "array": normals,
                "itemSize": 3,
                "count": vertex_index
            }
        },
        "faces": face_data
    }
    
    # Add UVs if available
    if uvs:
        buf_data["attributes"]["uv"] = {
            "array": uvs,
            "itemSize": 2,
            "count": vertex_index
        }
    
    # Clean up
    bm.free()
    
    # Write to file
    with open(filepath, 'w') as f:
        json.dump(buf_data, f, indent=2)
    
    print(f"Exported {obj.name} to {filepath}")
    print(f"- Vertices: {buf_data['metadata']['vertex_count']}")
    print(f"- Quads: {buf_data['metadata']['quad_count']}")
    print(f"- Triangles: {buf_data['metadata']['triangle_count']}")

# Blender operator class
class ExportBUF(bpy.types.Operator):
    """Export mesh to Buffer Geometry (.buf) format"""
    bl_idname = "export_mesh.buf"
    bl_label = "Export BUF"
    bl_options = {'REGISTER', 'UNDO'}
    
    # File browser properties
    filepath: bpy.props.StringProperty(
        name="File Path",
        description="File path for the exported .buf file",
        maxlen=1024,
        subtype='FILE_PATH'
    )
    
    filename_ext = ".buf"

    filter_glob: bpy.props.StringProperty(
        default="*.buf",
        options={'HIDDEN'}
    )
    
    def execute(self, context):
        try:
            export_buf_format(self.filepath, context)
            self.report({'INFO'}, f"Successfully exported to {self.filepath}")
            return {'FINISHED'}
        except Exception as e:
            self.report({'ERROR'}, f"Export failed: {str(e)}")
            return {'CANCELLED'}
    
    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

# Menu function
def menu_func_export(self, context):
    self.layout.operator(ExportBUF.bl_idname, text="Buffer Geometry (.buf)")

# Register the operator
def register():
    bpy.utils.register_class(ExportBUF)
    bpy.types.TOPBAR_MT_file_export.append(menu_func_export)

def unregister():
    bpy.utils.unregister_class(ExportBUF)
    bpy.types.TOPBAR_MT_file_export.remove(menu_func_export)

if __name__ == "__main__":
    register()
